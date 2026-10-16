import { describe, it, expect, beforeEach } from 'bun:test';
import {
	PersonalizationState,
	sanitizeRecentlyViewedItem,
	parseRecentlyViewed,
	parseSearchHistory,
	MAX_RECENTLY_VIEWED,
	MAX_SEARCH_HISTORY,
	RECENTLY_VIEWED_KEY,
	SEARCH_HISTORY_KEY
} from '../src/lib/personalization.svelte';
import type { Movie } from '../src/lib/types/movie';

class MockLocalStorage {
	private store: Record<string, string> = {};
	public shouldThrow = false;

	getItem(key: string): string | null {
		if (this.shouldThrow) throw new Error('Storage disabled');
		return this.store[key] ?? null;
	}

	setItem(key: string, value: string): void {
		if (this.shouldThrow) throw new Error('Storage quota exceeded');
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
	overview: 'A wormhole journey',
	posterUrl: 'https://image.tmdb.org/poster1.jpg',
	backdropUrl: '',
	genres: ['Sci-Fi']
};

const sampleMovie2: Movie = {
	id: '335984',
	title: 'Blade Runner 2049',
	overview: 'Cyberpunk mystery',
	posterUrl: 'https://image.tmdb.org/poster2.jpg',
	backdropUrl: '',
	genres: ['Sci-Fi']
};

describe('Phase 5: Personalization & History Logic', () => {
	describe('Storage Keys and Constants', () => {
		it('uses correct namespaced storage keys', () => {
			expect(RECENTLY_VIEWED_KEY).toBe('cineva:recently_viewed');
			expect(SEARCH_HISTORY_KEY).toBe('cineva:search_history');
		});
	});

	describe('sanitizeRecentlyViewedItem', () => {
		it('returns null for invalid inputs', () => {
			expect(sanitizeRecentlyViewedItem(null)).toBeNull();
			expect(sanitizeRecentlyViewedItem({})).toBeNull();
			expect(sanitizeRecentlyViewedItem({ id: '1' })).toBeNull(); // missing title
		});

		it('sanitizes valid item fields', () => {
			const item = sanitizeRecentlyViewedItem({
				id: '123',
				title: 'Film Title',
				posterUrl: '/poster.jpg',
				releaseYear: '2020',
				rating: 7.5,
				genres: ['Action']
			});

			expect(item).not.toBeNull();
			expect(item?.id).toBe('123');
			expect(item?.title).toBe('Film Title');
			expect(item?.releaseYear).toBe(2020);
			expect(item?.rating).toBe(7.5);
		});
	});

	describe('parseRecentlyViewed', () => {
		it('returns empty array on invalid JSON', () => {
			expect(parseRecentlyViewed(null)).toEqual([]);
			expect(parseRecentlyViewed('invalid')).toEqual([]);
		});

		it('parses versioned items array and deduplicates', () => {
			const json = JSON.stringify({
				version: 1,
				items: [
					{ id: '1', title: 'Film 1' },
					{ id: '1', title: 'Film 1 Duplicate' },
					{ id: '2', title: 'Film 2' }
				]
			});

			const parsed = parseRecentlyViewed(json);
			expect(parsed).toHaveLength(2);
			expect(parsed[0].id).toBe('1');
			expect(parsed[1].id).toBe('2');
		});
	});

	describe('parseSearchHistory', () => {
		it('returns empty array on invalid JSON', () => {
			expect(parseSearchHistory(null)).toEqual([]);
			expect(parseSearchHistory('bad json')).toEqual([]);
			expect(parseSearchHistory('{ not array }')).toEqual([]);
		});

		it('parses, trims, deduplicates case-insensitively, and bounds search history', () => {
			const input = JSON.stringify([
				'Dune',
				'  dune  ',
				'Interstellar',
				'Oppenheimer',
				'Matrix',
				'Arrival',
				'Alien',
				'Gravity',
				'Solaris',
				'Contact'
			]);

			const result = parseSearchHistory(input);
			expect(result[0]).toBe('Dune');
			expect(result[1]).toBe('Interstellar');
			// Deduplicated dune
			expect(result.filter((q) => q.toLowerCase() === 'dune')).toHaveLength(1);
			// Bounded at MAX_SEARCH_HISTORY
			expect(result.length).toBeLessThanOrEqual(MAX_SEARCH_HISTORY);
		});
	});

	describe('PersonalizationState Store', () => {
		let mockStorage: MockLocalStorage;

		beforeEach(() => {
			mockStorage = new MockLocalStorage();
			// @ts-expect-error mock window
			globalThis.window = {
				addEventListener: () => {},
				removeEventListener: () => {}
			};
			// @ts-expect-error mock localStorage
			globalThis.localStorage = mockStorage;
		});

		it('records recently viewed movie and prepends to the front', () => {
			const state = new PersonalizationState();
			state.addRecentlyViewed(sampleMovie1);
			state.addRecentlyViewed(sampleMovie2);

			expect(state.recentlyViewed).toHaveLength(2);
			expect(state.recentlyViewed[0].id).toBe('335984'); // Blade runner most recent
			expect(state.recentlyViewed[1].id).toBe('157336'); // Interstellar next

			// Re-visiting movie 1 moves it back to top
			state.addRecentlyViewed(sampleMovie1);
			expect(state.recentlyViewed).toHaveLength(2);
			expect(state.recentlyViewed[0].id).toBe('157336');
			expect(state.recentlyViewed[1].id).toBe('335984');
		});

		it('enforces maximum history limit for recently viewed items', () => {
			const state = new PersonalizationState();
			for (let i = 1; i <= 15; i++) {
				state.addRecentlyViewed({
					id: String(i),
					title: `Movie ${i}`,
					overview: '',
					posterUrl: '',
					backdropUrl: '',
					genres: []
				});
			}

			expect(state.recentlyViewed.length).toBe(MAX_RECENTLY_VIEWED);
			expect(state.recentlyViewed[0].id).toBe('15');
		});

		it('removes and clears recently viewed movies', () => {
			const state = new PersonalizationState();
			state.addRecentlyViewed(sampleMovie1);
			state.addRecentlyViewed(sampleMovie2);

			state.removeRecentlyViewed('157336');
			expect(state.recentlyViewed).toHaveLength(1);
			expect(state.recentlyViewed[0].id).toBe('335984');

			state.clearRecentlyViewed();
			expect(state.recentlyViewed).toHaveLength(0);
		});

		it('manages search queries: adding, deduplicating, removing, and clearing', () => {
			const state = new PersonalizationState();

			state.addSearchQuery('Nolan');
			state.addSearchQuery('Villeneuve');
			state.addSearchQuery('nolan'); // should deduplicate and promote to top

			expect(state.searchHistory).toHaveLength(2);
			expect(state.searchHistory[0]).toBe('nolan');
			expect(state.searchHistory[1]).toBe('Villeneuve');

			// Ignores whitespace or tiny strings (< 2 chars)
			state.addSearchQuery(' ');
			state.addSearchQuery('a');
			expect(state.searchHistory).toHaveLength(2);

			state.removeSearchQuery('villeneuve');
			expect(state.searchHistory).toEqual(['nolan']);

			state.clearSearchHistory();
			expect(state.searchHistory).toEqual([]);
		});
	});
});
