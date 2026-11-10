import { describe, it, expect, beforeEach } from 'bun:test';
import {
	sanitizeWatchlistItem,
	parseWatchlistStorage,
	tvShowToWatchlistItem,
	watchlistItemToTVShow,
	movieToWatchlistItem,
	watchlistItemToMovie,
	WatchlistState,
	WATCHLIST_STORAGE_KEY
} from '../src/lib/watchlist.svelte';
import {
	mapTMDBPersonToProfile,
	clearCache
} from '../src/lib/server/tmdb';
import type { TVShow } from '../src/lib/types/tv';
import type { Movie } from '../src/lib/types/movie';
import type {
	TMDBPerson,
	TMDBPersonMovieCredits,
	TMDBPersonTVCredits
} from '../src/lib/types/tmdb';

class MockLocalStorage {
	private store: Record<string, string> = {};
	public shouldThrow = false;

	getItem(key: string): string | null {
		if (this.shouldThrow) throw new Error('SecurityError');
		return this.store[key] ?? null;
	}

	setItem(key: string, value: string): void {
		if (this.shouldThrow) throw new Error('QuotaExceeded');
		this.store[key] = String(value);
	}

	removeItem(key: string): void {
		delete this.store[key];
	}

	clear(): void {
		this.store = {};
	}
}

describe('TV Watchlist & Person Filmography Tests', () => {
	let mockStorage: MockLocalStorage;

	beforeEach(() => {
		clearCache();
		mockStorage = new MockLocalStorage();
		// @ts-expect-error mock window and localStorage
		globalThis.window = {
			addEventListener: () => {},
			removeEventListener: () => {},
			localStorage: mockStorage
		};
		// @ts-expect-error mock localStorage
		globalThis.localStorage = mockStorage;
	});

	describe('TV Watchlist Converters & Model Mapping', () => {
		it('tvShowToWatchlistItem accurately converts TVShow into WatchlistItem with mediaType: "tv"', () => {
			const show: TVShow = {
				id: '93405',
				title: 'Squid Game',
				name: 'Squid Game',
				firstAirYear: 2021,
				rating: 7.8,
				genres: ['Action & Adventure', 'Drama', 'Mystery'],
				posterUrl: 'https://image.tmdb.org/t/p/w500/squid.jpg',
				backdropUrl: 'https://image.tmdb.org/t/p/w1280/squid_bg.jpg',
				overview: 'Hundreds of cash-strapped players accept a strange invitation.',
				mediaType: 'tv'
			};

			const item = tvShowToWatchlistItem(show);

			expect(item.id).toBe('93405');
			expect(item.title).toBe('Squid Game');
			expect(item.mediaType).toBe('tv');
			expect(item.releaseYear).toBe(2021);
			expect(item.rating).toBe(7.8);
			expect(item.genres).toEqual(['Action & Adventure', 'Drama', 'Mystery']);
			expect(item.posterUrl).toBe(show.posterUrl);
		});

		it('watchlistItemToTVShow accurately restores a TVShow model for UI rendering', () => {
			const item = sanitizeWatchlistItem({
				id: '93405',
				title: 'Squid Game',
				mediaType: 'tv',
				firstAirYear: 2021,
				rating: 7.8,
				genres: ['Drama'],
				posterUrl: 'https://image.tmdb.org/t/p/w500/squid.jpg',
				overview: 'Survival game.'
			})!;

			const show = watchlistItemToTVShow(item);

			expect(show.id).toBe('93405');
			expect(show.name).toBe('Squid Game');
			expect(show.title).toBe('Squid Game');
			expect(show.mediaType).toBe('tv');
			expect(show.firstAirYear).toBe(2021);
			expect(show.rating).toBe(7.8);
		});
	});

	describe('Compound Key Coexistence & Deduplication', () => {
		it('allows a movie and TV show sharing the identical numeric ID to coexist in storage', () => {
			const state = new WatchlistState();

			const movie: Movie = {
				id: '500',
				title: 'Movie Five Hundred',
				releaseYear: 2020,
				rating: 8.1,
				genres: ['Drama'],
				posterUrl: '/movie500.jpg',
				backdropUrl: '',
				overview: 'A movie with ID 500'
			};

			const tvShow: TVShow = {
				id: '500',
				title: 'Series Five Hundred',
				name: 'Series Five Hundred',
				firstAirYear: 2023,
				rating: 8.9,
				genres: ['Comedy'],
				posterUrl: '/tv500.jpg',
				backdropUrl: '',
				overview: 'A TV series with ID 500',
				mediaType: 'tv'
			};

			// Add movie
			state.add(movie, 'movie');
			expect(state.has('500', 'movie')).toBe(true);
			expect(state.has('500', 'tv')).toBe(false);
			expect(state.count).toBe(1);
			expect(state.movieCount).toBe(1);
			expect(state.tvCount).toBe(0);

			// Add TV show with SAME ID
			state.add(tvShow, 'tv');
			expect(state.has('500', 'movie')).toBe(true);
			expect(state.has('500', 'tv')).toBe(true);
			expect(state.count).toBe(2);
			expect(state.movieCount).toBe(1);
			expect(state.tvCount).toBe(1);

			// Prevent duplicate additions within the same content type
			state.add(tvShow, 'tv');
			expect(state.count).toBe(2);

			// Remove movie without affecting TV show
			state.remove('500', 'movie');
			expect(state.has('500', 'movie')).toBe(false);
			expect(state.has('500', 'tv')).toBe(true);
			expect(state.count).toBe(1);
			expect(state.tvCount).toBe(1);

			// Toggle TV show
			state.toggle(tvShow, 'tv');
			expect(state.has('500', 'tv')).toBe(false);
			expect(state.count).toBe(0);
		});

		it('filters sorted items by content type: all, movie, tv', () => {
			const state = new WatchlistState();

			state.add(
				{
					id: '1',
					title: 'Movie Alpha',
					releaseYear: 2022,
					rating: 7.0,
					genres: ['Action'],
					posterUrl: '',
					backdropUrl: '',
					overview: ''
				},
				'movie'
			);

			state.add(
				{
					id: '2',
					title: 'TV Beta',
					name: 'TV Beta',
					firstAirYear: 2024,
					rating: 9.0,
					genres: ['Drama'],
					posterUrl: '',
					backdropUrl: '',
					overview: '',
					mediaType: 'tv'
				},
				'tv'
			);

			const allItems = state.getSortedItems('rating_desc', 'all');
			expect(allItems).toHaveLength(2);
			expect(allItems[0].title).toBe('TV Beta'); // 9.0 > 7.0

			const moviesOnly = state.getSortedItems('rating_desc', 'movie');
			expect(moviesOnly).toHaveLength(1);
			expect(moviesOnly[0].title).toBe('Movie Alpha');

			const tvOnly = state.getSortedItems('rating_desc', 'tv');
			expect(tvOnly).toHaveLength(1);
			expect(tvOnly[0].title).toBe('TV Beta');
		});
	});

	describe('Person Profile with Separated Movie and TV Credits', () => {
		it('mapTMDBPersonToProfile populates separate movieCredits and tvCredits groups', () => {
			const rawPerson: TMDBPerson = {
				id: 888,
				name: 'Lee Do-hyun',
				biography: 'South Korean actor known for drama series and film.',
				known_for_department: 'Acting',
				birthday: '1995-04-11'
			};

			const mockMovieCredits: TMDBPersonMovieCredits = {
				id: 888,
				cast: [
					{
						id: 1001,
						title: 'Exhuma',
						character: 'Bong-gil',
						release_date: '2024-02-22',
						vote_average: 7.5,
						vote_count: 300,
						poster_path: '/exhuma.jpg',
						genre_ids: [9648, 27]
					}
				],
				crew: []
			};

			const mockTVCredits: TMDBPersonTVCredits = {
				id: 888,
				cast: [
					{
						id: 2001,
						name: 'The Good Bad Mother',
						character: 'Choi Kang-ho',
						first_air_date: '2023-04-26',
						vote_average: 8.3,
						vote_count: 240,
						poster_path: '/mother.jpg',
						episode_count: 14,
						genre_ids: [18, 35]
					},
					{
						id: 2002,
						name: 'Sweet Home',
						character: 'Lee Eun-hyuk',
						first_air_date: '2020-12-18',
						vote_average: 8.4,
						vote_count: 1200,
						poster_path: '/sweethome.jpg',
						episode_count: 18,
						genre_ids: [18, 10765]
					}
				],
				crew: []
			};

			const profile = mapTMDBPersonToProfile(rawPerson, mockMovieCredits, mockTVCredits);

			expect(profile.name).toBe('Lee Do-hyun');
			expect(profile.movieCreditsCount).toBe(1);
			expect(profile.tvCreditsCount).toBe(2);
			expect(profile.totalCreditsCount).toBe(3);

			// Movie credits structure
			expect(profile.movieCredits?.acting).toHaveLength(1);
			expect(profile.movieCredits?.acting[0].title).toBe('Exhuma');
			expect(profile.movieCredits?.acting[0].character).toBe('Bong-gil');

			// TV credits structure
			expect(profile.tvCredits?.acting).toHaveLength(2);
			expect(profile.tvCredits?.acting[0].name).toBe('The Good Bad Mother'); // 2023 sorted before 2020
			expect(profile.tvCredits?.acting[0].episodeCount).toBe(14);
			expect(profile.tvCredits?.acting[0].mediaType).toBe('tv');
			expect(profile.tvCredits?.acting[1].name).toBe('Sweet Home');
		});
	});
});
