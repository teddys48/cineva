import { SvelteSet } from 'svelte/reactivity';
import { untrack } from 'svelte';
import type { Movie, MovieDetail } from './types/movie';

export const RECENTLY_VIEWED_KEY = 'cineva:recently_viewed';
export const LEGACY_RECENTLY_VIEWED_KEY = 'scenora:recently_viewed';
export const SEARCH_HISTORY_KEY = 'cineva:search_history';
export const LEGACY_SEARCH_HISTORY_KEY = 'scenora:search_history';

export const MAX_RECENTLY_VIEWED = 10;
export const MAX_SEARCH_HISTORY = 8;

export interface RecentlyViewedItem {
	id: string;
	title: string;
	posterUrl: string;
	backdropUrl?: string;
	releaseYear?: number | null;
	rating?: number | null;
	genres?: string[];
	runtime?: string;
	viewedAt: number;
}

export interface RecentlyViewedStorage {
	version: number;
	items: RecentlyViewedItem[];
}

export function sanitizeRecentlyViewedItem(raw: unknown): RecentlyViewedItem | null {
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

	let releaseYear: number | null = null;
	if (typeof record.releaseYear === 'number' && !Number.isNaN(record.releaseYear)) {
		releaseYear = record.releaseYear;
	} else if (typeof record.releaseYear === 'string') {
		const parsed = parseInt(record.releaseYear, 10);
		if (!Number.isNaN(parsed)) releaseYear = parsed;
	}

	let rating: number | null = null;
	if (typeof record.rating === 'number' && !Number.isNaN(record.rating)) {
		rating = Math.max(0, Math.min(10, Math.round(record.rating * 10) / 10));
	}

	let genres: string[] = [];
	if (Array.isArray(record.genres)) {
		genres = record.genres
			.filter((g): g is string => typeof g === 'string' && g.trim().length > 0)
			.slice(0, 4);
	}

	const runtime = typeof record.runtime === 'string' ? record.runtime : undefined;

	let viewedAt = Date.now();
	if (
		typeof record.viewedAt === 'number' &&
		!Number.isNaN(record.viewedAt) &&
		record.viewedAt > 0
	) {
		viewedAt = record.viewedAt;
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
		viewedAt
	};
}

export function parseRecentlyViewed(rawJson: string | null): RecentlyViewedItem[] {
	if (!rawJson) return [];

	try {
		const parsed: unknown = JSON.parse(rawJson);
		if (!parsed || typeof parsed !== 'object') return [];

		let rawItems: unknown[] = [];
		if (Array.isArray(parsed)) {
			rawItems = parsed;
		} else if ('items' in parsed && Array.isArray((parsed as { items: unknown[] }).items)) {
			rawItems = (parsed as { items: unknown[] }).items;
		} else {
			return [];
		}

		const items: RecentlyViewedItem[] = [];
		const seenIds = new SvelteSet<string>();

		for (const rawItem of rawItems) {
			const sanitized = sanitizeRecentlyViewedItem(rawItem);
			if (sanitized && !seenIds.has(sanitized.id)) {
				seenIds.add(sanitized.id);
				items.push(sanitized);
				if (items.length >= MAX_RECENTLY_VIEWED) break;
			}
		}

		return items;
	} catch {
		return [];
	}
}

export function parseSearchHistory(rawJson: string | null): string[] {
	if (!rawJson) return [];

	try {
		const parsed: unknown = JSON.parse(rawJson);
		let list: unknown[] = [];
		if (Array.isArray(parsed)) {
			list = parsed;
		} else if (
			parsed &&
			typeof parsed === 'object' &&
			'queries' in parsed &&
			Array.isArray((parsed as { queries: unknown[] }).queries)
		) {
			list = (parsed as { queries: unknown[] }).queries;
		}

		const queries: string[] = [];
		const seen = new SvelteSet<string>();

		for (const item of list) {
			if (typeof item === 'string') {
				const trimmed = item.trim();
				const normalized = trimmed.toLowerCase();
				if (trimmed.length > 0 && !seen.has(normalized)) {
					seen.add(normalized);
					queries.push(trimmed);
					if (queries.length >= MAX_SEARCH_HISTORY) break;
				}
			}
		}

		return queries;
	} catch {
		return [];
	}
}

export class PersonalizationState {
	recentlyViewed = $state<RecentlyViewedItem[]>([]);
	searchHistory = $state<string[]>([]);
	isInitialized = $state(false);

	constructor() {
		if (typeof window !== 'undefined') {
			this.init();
		}
	}

	init() {
		if (typeof window === 'undefined') return;

		try {
			const viewedRaw =
				localStorage.getItem(RECENTLY_VIEWED_KEY) ||
				localStorage.getItem(LEGACY_RECENTLY_VIEWED_KEY);
			this.recentlyViewed = parseRecentlyViewed(viewedRaw);
		} catch {
			this.recentlyViewed = [];
		}

		try {
			const searchRaw =
				localStorage.getItem(SEARCH_HISTORY_KEY) || localStorage.getItem(LEGACY_SEARCH_HISTORY_KEY);
			this.searchHistory = parseSearchHistory(searchRaw);
		} catch {
			this.searchHistory = [];
		}

		this.isInitialized = true;
		window.addEventListener('storage', this.handleStorageEvent);
	}

	destroy() {
		if (typeof window !== 'undefined') {
			window.removeEventListener('storage', this.handleStorageEvent);
		}
	}

	private handleStorageEvent = (event: StorageEvent) => {
		if (event.key === RECENTLY_VIEWED_KEY || event.key === LEGACY_RECENTLY_VIEWED_KEY) {
			this.recentlyViewed = parseRecentlyViewed(event.newValue);
		} else if (event.key === SEARCH_HISTORY_KEY || event.key === LEGACY_SEARCH_HISTORY_KEY) {
			this.searchHistory = parseSearchHistory(event.newValue);
		}
	};

	private persistRecentlyViewed() {
		if (typeof window === 'undefined') return;
		try {
			const payload: RecentlyViewedStorage = {
				version: 1,
				items: this.recentlyViewed
			};
			localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(payload));
		} catch {
			// Storage full or disabled
		}
	}

	private persistSearchHistory() {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(
				SEARCH_HISTORY_KEY,
				JSON.stringify({
					version: 1,
					queries: this.searchHistory
				})
			);
		} catch {
			// Storage full or disabled
		}
	}

	addRecentlyViewed(movie: Movie | MovieDetail) {
		untrack(() => {
			const id = String(movie.id);
			const filtered = this.recentlyViewed.filter((item) => item.id !== id);

			const newItem: RecentlyViewedItem = {
				id,
				title: movie.title,
				posterUrl: movie.posterUrl || '',
				backdropUrl: movie.backdropUrl || '',
				releaseYear: movie.releaseYear ?? null,
				rating: movie.rating ?? null,
				genres: movie.genres ? movie.genres.slice(0, 3) : [],
				runtime: movie.runtime,
				viewedAt: Date.now()
			};

			this.recentlyViewed = [newItem, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
			this.persistRecentlyViewed();
		});
	}

	removeRecentlyViewed(movieId: string | number) {
		untrack(() => {
			const targetId = String(movieId);
			this.recentlyViewed = this.recentlyViewed.filter((item) => item.id !== targetId);
			this.persistRecentlyViewed();
		});
	}

	clearRecentlyViewed() {
		untrack(() => {
			this.recentlyViewed = [];
			this.persistRecentlyViewed();
		});
	}

	get recentlyViewedMovies(): Movie[] {
		return this.recentlyViewed.map((item) => ({
			id: item.id,
			title: item.title,
			posterUrl: item.posterUrl,
			backdropUrl: item.backdropUrl || '',
			releaseYear: item.releaseYear,
			rating: item.rating,
			genres: item.genres || [],
			runtime: item.runtime,
			overview: ''
		}));
	}

	addSearchQuery(query: string) {
		untrack(() => {
			const trimmed = query.trim();
			if (!trimmed || trimmed.length < 2) return;

			const normalized = trimmed.toLowerCase();
			const filtered = this.searchHistory.filter((q) => q.toLowerCase() !== normalized);
			this.searchHistory = [trimmed, ...filtered].slice(0, MAX_SEARCH_HISTORY);
			this.persistSearchHistory();
		});
	}

	removeSearchQuery(query: string) {
		untrack(() => {
			const normalized = query.trim().toLowerCase();
			this.searchHistory = this.searchHistory.filter((q) => q.toLowerCase() !== normalized);
			this.persistSearchHistory();
		});
	}

	clearSearchHistory() {
		untrack(() => {
			this.searchHistory = [];
			this.persistSearchHistory();
		});
	}
}

export const personalizationState = new PersonalizationState();
