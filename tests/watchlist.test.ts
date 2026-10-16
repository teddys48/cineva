import { describe, it, expect, beforeEach } from 'bun:test';
import {
	sanitizeWatchlistItem,
	parseWatchlistStorage,
	movieToWatchlistItem,
	watchlistItemToMovie,
	WatchlistState,
	WATCHLIST_STORAGE_KEY,
	CURRENT_SCHEMA_VERSION
} from '../src/lib/watchlist.svelte';
import type { Movie } from '../src/lib/types/movie';
import type { WatchlistItem } from '../src/lib/types/watchlist';

// Mock browser localStorage
class MockLocalStorage {
	private store: Record<string, string> = {};
	public shouldThrow = false;

	getItem(key: string): string | null {
		if (this.shouldThrow) throw new Error('SecurityError: The operation is insecure.');
		return this.store[key] ?? null;
	}

	setItem(key: string, value: string): void {
		if (this.shouldThrow) throw new Error('QuotaExceededError: DomException');
		this.store[key] = String(value);
	}

	removeItem(key: string): void {
		delete this.store[key];
	}

	clear(): void {
		this.store = {};
	}
}

const sampleMovie1: Movie = {
	id: '157336',
	title: 'Interstellar',
	overview: 'A team of explorers travel through a wormhole in space.',
	posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
	backdropUrl: 'https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
	releaseYear: 2014,
	rating: 8.4,
	genres: ['Adventure', 'Drama', 'Science Fiction'],
	runtime: '2h 49m'
};

const sampleMovie2: Movie = {
	id: '335984',
	title: 'Blade Runner 2049',
	overview: 'A young blade runner unearths a long-buried secret.',
	posterUrl: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
	backdropUrl: 'https://image.tmdb.org/t/p/w1280/sAtoMqDVhNDQBc3QJL3RF6hlxGq.jpg',
	releaseYear: 2017,
	rating: 7.9,
	genres: ['Science Fiction', 'Mystery'],
	runtime: '2h 44m'
};

describe('Phase 5: Watchlist Storage & State Logic', () => {
	describe('sanitizeWatchlistItem', () => {
		it('returns null for non-object, null, or undefined values', () => {
			expect(sanitizeWatchlistItem(null)).toBeNull();
			expect(sanitizeWatchlistItem(undefined)).toBeNull();
			expect(sanitizeWatchlistItem('string')).toBeNull();
			expect(sanitizeWatchlistItem(123)).toBeNull();
		});

		it('returns null if item lacks a valid id or title', () => {
			expect(sanitizeWatchlistItem({ title: 'No ID' })).toBeNull();
			expect(sanitizeWatchlistItem({ id: '', title: 'Empty ID' })).toBeNull();
			expect(sanitizeWatchlistItem({ id: '123' })).toBeNull();
			expect(sanitizeWatchlistItem({ id: '123', title: '   ' })).toBeNull();
		});

		it('coerces numeric IDs to string and sanitizes basic fields', () => {
			const item = sanitizeWatchlistItem({
				id: 999,
				title: ' Dune ',
				posterUrl: 'https://image.tmdb.org/poster.jpg',
				releaseYear: 2021,
				rating: 8.05,
				genres: ['Sci-Fi', 'Adventure', ''],
				savedAt: 1600000000000
			});

			expect(item).not.toBeNull();
			expect(item?.id).toBe('999');
			expect(item?.title).toBe('Dune');
			expect(item?.posterUrl).toBe('https://image.tmdb.org/poster.jpg');
			expect(item?.releaseYear).toBe(2021);
			expect(item?.rating).toBe(8.1); // rounded to 1 decimal
			expect(item?.genres).toEqual(['Sci-Fi', 'Adventure']);
			expect(item?.savedAt).toBe(1600000000000);
		});

		it('handles string release years and bounds rating to [0, 10]', () => {
			const item = sanitizeWatchlistItem({
				id: '1',
				title: 'Film',
				releaseYear: '1999',
				rating: 15
			});

			expect(item?.releaseYear).toBe(1999);
			expect(item?.rating).toBe(10);
		});
	});

	describe('parseWatchlistStorage', () => {
		it('returns empty array for empty, null, or malformed JSON', () => {
			expect(parseWatchlistStorage(null)).toEqual([]);
			expect(parseWatchlistStorage('')).toEqual([]);
			expect(parseWatchlistStorage('not json')).toEqual([]);
			expect(parseWatchlistStorage('{ invalid')).toEqual([]);
			expect(parseWatchlistStorage('12345')).toEqual([]);
		});

		it('parses versioned storage schema correctly', () => {
			const json = JSON.stringify({
				version: CURRENT_SCHEMA_VERSION,
				items: [
					{ id: '100', title: 'Movie 100', savedAt: 1000 },
					{ id: '200', title: 'Movie 200', savedAt: 2000 }
				]
			});

			const items = parseWatchlistStorage(json);
			expect(items).toHaveLength(2);
			expect(items[0].id).toBe('100');
			expect(items[1].id).toBe('200');
		});

		it('parses legacy unversioned array format for backward compatibility', () => {
			const json = JSON.stringify([
				{ id: '1', title: 'Legacy Film 1' },
				{ id: '2', title: 'Legacy Film 2' }
			]);

			const items = parseWatchlistStorage(json);
			expect(items).toHaveLength(2);
			expect(items[0].title).toBe('Legacy Film 1');
		});

		it('deduplicates items with identical IDs in storage', () => {
			const json = JSON.stringify({
				version: 1,
				items: [
					{ id: '100', title: 'Movie 100' },
					{ id: '100', title: 'Movie 100 Duplicate' },
					{ id: '200', title: 'Movie 200' }
				]
			});

			const items = parseWatchlistStorage(json);
			expect(items).toHaveLength(2);
			expect(items[0].id).toBe('100');
			expect(items[1].id).toBe('200');
		});

		it('discards invalid records while preserving valid records', () => {
			const json = JSON.stringify({
				version: 1,
				items: [
					{ id: '100', title: 'Valid Film' },
					{ id: null, title: 'Corrupted' },
					null,
					'garbage',
					{ id: '200', title: 'Another Valid' }
				]
			});

			const items = parseWatchlistStorage(json);
			expect(items).toHaveLength(2);
			expect(items[0].id).toBe('100');
			expect(items[1].id).toBe('200');
		});
	});

	describe('Model Converters', () => {
		it('movieToWatchlistItem converts Movie into compact WatchlistItem', () => {
			const item = movieToWatchlistItem(sampleMovie1);
			expect(item.id).toBe('157336');
			expect(item.title).toBe('Interstellar');
			expect(item.releaseYear).toBe(2014);
			expect(item.rating).toBe(8.4);
			expect(typeof item.savedAt).toBe('number');
		});

		it('watchlistItemToMovie converts WatchlistItem into Movie for component rendering', () => {
			const item: WatchlistItem = {
				id: '157336',
				title: 'Interstellar',
				posterUrl: 'https://image.tmdb.org/poster.jpg',
				releaseYear: 2014,
				rating: 8.4,
				genres: ['Sci-Fi'],
				runtime: '2h 49m',
				overview: 'Space journey',
				savedAt: 1000
			};

			const movie = watchlistItemToMovie(item);
			expect(movie.id).toBe('157336');
			expect(movie.title).toBe('Interstellar');
			expect(movie.genres).toEqual(['Sci-Fi']);
			expect(movie.overview).toBe('Space journey');
		});
	});

	describe('WatchlistState Active Store & CRUD Operations', () => {
		let mockStorage: MockLocalStorage;

		beforeEach(() => {
			mockStorage = new MockLocalStorage();
			// @ts-expect-error mock window and localStorage
			globalThis.window = {
				addEventListener: () => {},
				removeEventListener: () => {}
			};
			// @ts-expect-error mock localStorage
			globalThis.localStorage = mockStorage;
		});

		it('initializes with empty list when localStorage is empty', () => {
			const state = new WatchlistState();
			expect(state.items).toEqual([]);
			expect(state.count).toBe(0);
			expect(state.isInitialized).toBe(true);
			expect(state.storageAvailable).toBe(true);
		});

		it('adds a movie and persists to localStorage', () => {
			const state = new WatchlistState();
			const success = state.add(sampleMovie1);

			expect(success).toBe(true);
			expect(state.count).toBe(1);
			expect(state.has('157336')).toBe(true);
			expect(state.has(157336)).toBe(true);

			const storedRaw = mockStorage.getItem(WATCHLIST_STORAGE_KEY);
			expect(storedRaw).not.toBeNull();
			const parsed = JSON.parse(storedRaw!);
			expect(parsed.version).toBe(CURRENT_SCHEMA_VERSION);
			expect(parsed.items).toHaveLength(1);
			expect(parsed.items[0].title).toBe('Interstellar');
		});

		it('prevents duplicate additions when adding the same movie twice', () => {
			const state = new WatchlistState();
			state.add(sampleMovie1);
			state.add(sampleMovie1);

			expect(state.count).toBe(1);
		});

		it('removes a movie and updates localStorage', () => {
			const state = new WatchlistState();
			state.add(sampleMovie1);
			state.add(sampleMovie2);
			expect(state.count).toBe(2);

			const removed = state.remove('157336');
			expect(removed).toBe(true);
			expect(state.count).toBe(1);
			expect(state.has('157336')).toBe(false);
			expect(state.has('335984')).toBe(true);

			const stored = parseWatchlistStorage(mockStorage.getItem(WATCHLIST_STORAGE_KEY));
			expect(stored).toHaveLength(1);
			expect(stored[0].id).toBe('335984');
		});

		it('toggle adds movie if absent, and removes movie if present', () => {
			const state = new WatchlistState();
			expect(state.has(sampleMovie1.id)).toBe(false);

			state.toggle(sampleMovie1);
			expect(state.has(sampleMovie1.id)).toBe(true);

			state.toggle(sampleMovie1);
			expect(state.has(sampleMovie1.id)).toBe(false);
		});

		it('clears all movies on clear()', () => {
			const state = new WatchlistState();
			state.add(sampleMovie1);
			state.add(sampleMovie2);
			expect(state.count).toBe(2);

			state.clear();
			expect(state.count).toBe(0);
			expect(state.items).toEqual([]);

			const stored = parseWatchlistStorage(mockStorage.getItem(WATCHLIST_STORAGE_KEY));
			expect(stored).toHaveLength(0);
		});

		it('sorts movies correctly by different sort options', () => {
			const state = new WatchlistState();
			state.add(sampleMovie1); // rating 8.4, year 2014, title Interstellar
			state.add(sampleMovie2); // rating 7.9, year 2017, title Blade Runner 2049

			const byRating = state.getSortedMovies('rating_desc');
			expect(byRating[0].title).toBe('Interstellar');
			expect(byRating[1].title).toBe('Blade Runner 2049');

			const byYear = state.getSortedMovies('year_desc');
			expect(byYear[0].title).toBe('Blade Runner 2049');
			expect(byYear[1].title).toBe('Interstellar');

			const byTitle = state.getSortedMovies('title_asc');
			expect(byTitle[0].title).toBe('Blade Runner 2049');
			expect(byTitle[1].title).toBe('Interstellar');
		});

		it('handles storage errors gracefully without crashing the app', () => {
			mockStorage.shouldThrow = true;
			const state = new WatchlistState();

			expect(state.storageAvailable).toBe(false);

			const success = state.add(sampleMovie1);
			expect(success).toBe(false);
			expect(state.toast?.type).toBe('error');
		});
	});
});
