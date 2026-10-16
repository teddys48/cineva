import { SvelteSet } from 'svelte/reactivity';
import { untrack } from 'svelte';
import type { Movie, MovieDetail } from './types/movie';
import type {
	WatchlistItem,
	WatchlistStorageData,
	WatchlistSortOption,
	ToastMessage
} from './types/watchlist';

export const WATCHLIST_STORAGE_KEY = 'cineva:watchlist';
export const LEGACY_WATCHLIST_STORAGE_KEY = 'scenora:watchlist';
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Validates and sanitizes a raw object into a valid WatchlistItem.
 * Returns null if the item is invalid or unrecoverable.
 */
export function sanitizeWatchlistItem(raw: unknown): WatchlistItem | null {
	if (!raw || typeof raw !== 'object') return null;

	const record = raw as Record<string, unknown>;
	const rawId = record.id;
	if (rawId === null || rawId === undefined || rawId === '') return null;
	const id = String(rawId).trim();
	if (!id) return null;

	const rawTitle = record.title;
	if (typeof rawTitle !== 'string' || !rawTitle.trim()) return null;
	const title = rawTitle.trim();

	const posterUrl = typeof record.posterUrl === 'string' ? record.posterUrl : '';
	const backdropUrl = typeof record.backdropUrl === 'string' ? record.backdropUrl : '';
	const overview = typeof record.overview === 'string' ? record.overview.slice(0, 300) : '';

	let releaseYear: number | null = null;
	if (typeof record.releaseYear === 'number' && !Number.isNaN(record.releaseYear)) {
		releaseYear = record.releaseYear;
	} else if (typeof record.releaseYear === 'string') {
		const parsed = parseInt(record.releaseYear, 10);
		if (!Number.isNaN(parsed) && parsed > 1880 && parsed < 2100) {
			releaseYear = parsed;
		}
	}

	let rating: number | null = null;
	if (typeof record.rating === 'number' && !Number.isNaN(record.rating)) {
		rating = Math.max(0, Math.min(10, Math.round(record.rating * 10) / 10));
	}

	let genres: string[] = [];
	if (Array.isArray(record.genres)) {
		genres = record.genres
			.filter((g): g is string => typeof g === 'string' && g.trim().length > 0)
			.slice(0, 5);
	}

	const runtime = typeof record.runtime === 'string' ? record.runtime : undefined;

	let savedAt = Date.now();
	if (typeof record.savedAt === 'number' && !Number.isNaN(record.savedAt) && record.savedAt > 0) {
		savedAt = record.savedAt;
	}

	return {
		id,
		title,
		posterUrl,
		backdropUrl,
		releaseYear,
		rating,
		genres,
		runtime,
		overview,
		savedAt
	};
}

/**
 * Validates stored JSON string and returns sanitized items list.
 */
export function parseWatchlistStorage(rawJson: string | null): WatchlistItem[] {
	if (!rawJson) return [];

	try {
		const parsed = JSON.parse(rawJson);
		if (!parsed || typeof parsed !== 'object') return [];

		// Handle versioned schema { version: number, items: [] }
		let rawItems: unknown[] = [];
		if (Array.isArray(parsed)) {
			// Legacy unversioned array format
			rawItems = parsed;
		} else if (Array.isArray((parsed as WatchlistStorageData).items)) {
			rawItems = (parsed as WatchlistStorageData).items;
		} else {
			return [];
		}

		const items: WatchlistItem[] = [];
		const seenIds = new SvelteSet<string>();

		for (const rawItem of rawItems) {
			const sanitized = sanitizeWatchlistItem(rawItem);
			if (sanitized && !seenIds.has(sanitized.id)) {
				seenIds.add(sanitized.id);
				items.push(sanitized);
			}
		}

		return items;
	} catch {
		// Malformed JSON is safely handled without crashing
		return [];
	}
}

/**
 * Convert any Movie or MovieDetail into a compact WatchlistItem.
 */
export function movieToWatchlistItem(movie: Movie | MovieDetail): WatchlistItem {
	return {
		id: String(movie.id),
		title: movie.title,
		posterUrl: movie.posterUrl || '',
		backdropUrl: movie.backdropUrl || '',
		releaseYear: movie.releaseYear ?? null,
		rating: movie.rating ?? null,
		genres: movie.genres ? movie.genres.slice(0, 4) : [],
		runtime: movie.runtime,
		overview: movie.overview ? movie.overview.slice(0, 240) : '',
		savedAt: Date.now()
	};
}

/**
 * Convert a stored WatchlistItem into a full Movie object for component rendering.
 */
export function watchlistItemToMovie(item: WatchlistItem): Movie {
	return {
		id: item.id,
		title: item.title,
		posterUrl: item.posterUrl,
		backdropUrl: item.backdropUrl || '',
		releaseYear: item.releaseYear,
		rating: item.rating,
		genres: item.genres || [],
		runtime: item.runtime,
		overview: item.overview || ''
	};
}

export class WatchlistState {
	items = $state<WatchlistItem[]>([]);
	isInitialized = $state(false);
	storageAvailable = $state(true);
	toast = $state<ToastMessage | null>(null);

	private toastTimeout: ReturnType<typeof setTimeout> | null = null;

	constructor() {
		if (typeof window !== 'undefined') {
			this.init();
		}
	}

	init() {
		if (typeof window === 'undefined') return;

		try {
			const raw =
				localStorage.getItem(WATCHLIST_STORAGE_KEY) ||
				localStorage.getItem(LEGACY_WATCHLIST_STORAGE_KEY);
			this.items = parseWatchlistStorage(raw);
			this.storageAvailable = true;
		} catch {
			this.storageAvailable = false;
			this.items = [];
		} finally {
			this.isInitialized = true;
		}

		// Listen for multi-tab updates
		window.addEventListener('storage', this.handleStorageEvent);
	}

	destroy() {
		if (typeof window !== 'undefined') {
			window.removeEventListener('storage', this.handleStorageEvent);
		}
		if (this.toastTimeout) {
			clearTimeout(this.toastTimeout);
		}
	}

	private handleStorageEvent = (event: StorageEvent) => {
		if (event.key === WATCHLIST_STORAGE_KEY || event.key === LEGACY_WATCHLIST_STORAGE_KEY) {
			this.items = parseWatchlistStorage(event.newValue);
		}
	};

	private persist(): boolean {
		if (typeof window === 'undefined') return false;

		const payload: WatchlistStorageData = {
			version: CURRENT_SCHEMA_VERSION,
			items: this.items
		};

		try {
			localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(payload));
			this.storageAvailable = true;
			return true;
		} catch {
			this.storageAvailable = false;
			this.showToast({
				id: String(Date.now()),
				message: 'Browser storage full or disabled. Watchlist could not be saved.',
				type: 'error'
			});
			return false;
		}
	}

	has(movieId: string | number): boolean {
		const targetId = String(movieId);
		return this.items.some((item) => item.id === targetId);
	}

	add(movie: Movie | MovieDetail): boolean {
		return untrack(() => {
			const targetId = String(movie.id);

			if (this.has(targetId)) {
				this.showToast({
					id: String(Date.now()),
					message: `"${movie.title}" is already in your watchlist`,
					type: 'info',
					movieTitle: movie.title
				});
				return false;
			}

			const newItem = movieToWatchlistItem(movie);
			this.items = [newItem, ...this.items];
			const persisted = this.persist();

			if (persisted) {
				this.showToast({
					id: String(Date.now()),
					message: `Added "${movie.title}" to your watchlist`,
					type: 'success',
					movieTitle: movie.title
				});
			}
			return persisted;
		});
	}

	remove(movieId: string | number): boolean {
		return untrack(() => {
			const targetId = String(movieId);
			const existing = this.items.find((item) => item.id === targetId);
			if (!existing) return false;

			this.items = this.items.filter((item) => item.id !== targetId);
			const persisted = this.persist();

			if (persisted) {
				this.showToast({
					id: String(Date.now()),
					message: `Removed "${existing.title}" from your watchlist`,
					type: 'info',
					movieTitle: existing.title
				});
			}
			return persisted;
		});
	}

	toggle(movie: Movie | MovieDetail): boolean {
		if (this.has(movie.id)) {
			this.remove(movie.id);
			return false;
		} else {
			this.add(movie);
			return true;
		}
	}

	clear(): boolean {
		return untrack(() => {
			if (this.items.length === 0) return true;
			this.items = [];
			const persisted = this.persist();
			if (persisted) {
				this.showToast({
					id: String(Date.now()),
					message: 'Watchlist cleared successfully',
					type: 'info'
				});
			}
			return persisted;
		});
	}

	get count(): number {
		return this.items.length;
	}

	get movies(): Movie[] {
		return this.items.map(watchlistItemToMovie);
	}

	getSortedMovies(sortBy: WatchlistSortOption): Movie[] {
		const copy = [...this.items];

		switch (sortBy) {
			case 'date_added_desc':
				copy.sort((a, b) => b.savedAt - a.savedAt);
				break;
			case 'date_added_asc':
				copy.sort((a, b) => a.savedAt - b.savedAt);
				break;
			case 'rating_desc':
				copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
				break;
			case 'year_desc':
				copy.sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0));
				break;
			case 'title_asc':
				copy.sort((a, b) => a.title.localeCompare(b.title));
				break;
		}

		return copy.map(watchlistItemToMovie);
	}

	showToast(toast: ToastMessage) {
		if (this.toastTimeout) {
			clearTimeout(this.toastTimeout);
		}
		this.toast = toast;
		this.toastTimeout = setTimeout(() => {
			if (this.toast?.id === toast.id) {
				this.toast = null;
			}
		}, 3200);
	}

	dismissToast() {
		if (this.toastTimeout) {
			clearTimeout(this.toastTimeout);
			this.toastTimeout = null;
		}
		this.toast = null;
	}
}

export const watchlistState = new WatchlistState();
