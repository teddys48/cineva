import { describe, it, expect, beforeEach } from 'bun:test';
import {
	searchTV,
	discoverTV,
	unifiedSearch,
	resolveTVGenre,
	getTVGenres,
	TMDB_TV_GENRES,
	clearCache,
	TMDBError
} from '../src/lib/server/tmdb';
import { interpretQuery, resolveGenre } from '../src/lib/search-query';
import type { TMDBTVShow, TMDBPaginatedResponse } from '../src/lib/types/tmdb';

function mockFetch(routes: Record<string, unknown>): { fetch: typeof fetch; getCapturedUrl: () => string } {
	let capturedUrl = '';
	const fetchFn = (async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input.toString();
		capturedUrl = url;

		const sortedKeys = Object.keys(routes).sort((a, b) => b.length - a.length);

		for (const pattern of sortedKeys) {
			if (url.includes(pattern)) {
				const responseData = routes[pattern];
				if (responseData instanceof Error) {
					return new Response(JSON.stringify({ status_message: responseData.message }), {
						status: (responseData as TMDBError).status || 500,
						headers: { 'Content-Type': 'application/json' }
					});
				}
				return new Response(JSON.stringify(responseData), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		return new Response(JSON.stringify({ status_message: 'Not found in mock' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' }
		});
	}) as typeof fetch;

	return { fetch: fetchFn, getCapturedUrl: () => capturedUrl };
}

describe('TV Search & Explore Discovery Tests', () => {
	beforeEach(() => {
		clearCache();
	});

	describe('TV Genre Resolution & Aliases', () => {
		it('accurately resolves TV-specific genre IDs', () => {
			expect(resolveTVGenre('Action & Adventure')).toBe(10759);
			expect(resolveTVGenre('action and adventure')).toBe(10759);
			expect(resolveTVGenre('action')).toBe(10759);
			expect(resolveTVGenre('Sci-Fi & Fantasy')).toBe(10765);
			expect(resolveTVGenre('sci-fi')).toBe(10765);
			expect(resolveTVGenre('Animation')).toBe(16);
			expect(resolveTVGenre('Drama')).toBe(18);
			expect(resolveTVGenre('Mystery')).toBe(9648);
			expect(resolveTVGenre('Kids')).toBe(10762);
			expect(resolveTVGenre('News')).toBe(10763);
			expect(resolveTVGenre('Reality')).toBe(10764);
			expect(resolveTVGenre('Soap')).toBe(10766);
			expect(resolveTVGenre('Talk')).toBe(10767);
			expect(resolveTVGenre('War & Politics')).toBe(10768);
		});

		it('does not confuse TV genre IDs with movie-only genre IDs', () => {
			// In movies, Action is 28 and Adventure is 12. In TV, Action & Adventure is 10759.
			expect(resolveTVGenre('Action')).toBe(10759);
			expect(resolveGenre('Action')?.id).toBe(28);

			// In movies, Sci-Fi is 878. In TV, Sci-Fi & Fantasy is 10765.
			expect(resolveTVGenre('Sci-Fi')).toBe(10765);
			expect(resolveGenre('Science Fiction')?.id).toBe(878);
		});
	});

	describe('TV Query Interpretation', () => {
		it('interprets TV drama queries with language and country filters', () => {
			const koreanDrama = interpretQuery('Korean drama');
			expect(koreanDrama.isMetadataDiscovery).toBe(true);
			expect(koreanDrama.discoveryFilters.languageCode).toBe('ko');
			expect(koreanDrama.discoveryFilters.genreId).toBe(18);

			const japaneseRomance = interpretQuery('Japanese romance drama');
			expect(japaneseRomance.isMetadataDiscovery).toBe(true);
			expect(japaneseRomance.discoveryFilters.languageCode).toBe('ja');
		});

		it('interprets notable TV series titles properly', () => {
			const moving = interpretQuery('Moving');
			expect(moving.isMetadataDiscovery).toBe(false);
			expect(moving.rawQuery).toBe('Moving');

			const squidGame = interpretQuery('Squid Game 2021');
			expect(squidGame.titleWithYear).toBeDefined();
			expect(squidGame.titleWithYear?.title).toBe('Squid Game');
			expect(squidGame.titleWithYear?.year).toBe(2021);
		});
	});

	describe('TMDB TV Endpoints Execution', () => {
		it('searchTV queries /search/tv with encoded parameters', async () => {
			const mockTVShows: TMDBPaginatedResponse<TMDBTVShow> = {
				page: 1,
				total_pages: 1,
				total_results: 1,
				results: [
					{
						id: 93405,
						name: 'Squid Game',
						original_name: '오징어 게임',
						overview: 'Deadly survival game.',
						first_air_date: '2021-09-17',
						genre_ids: [10759, 18, 9648],
						origin_country: ['KR'],
						original_language: 'ko',
						vote_average: 7.8,
						vote_count: 14000,
						poster_path: '/squid.jpg',
						backdrop_path: '/squid_bg.jpg'
					}
				]
			};

			const { fetch, getCapturedUrl } = mockFetch({
				'/search/tv': mockTVShows
			});

			const result = await searchTV(
				{
					query: 'Squid Game',
					first_air_date_year: 2021,
					page: 1
				},
				fetch
			);

			expect(getCapturedUrl()).toContain('/search/tv');
			expect(getCapturedUrl()).toContain('query=Squid+Game');
			expect(getCapturedUrl()).toContain('first_air_date_year=2021');
			expect(result.results).toHaveLength(1);
			expect(result.results[0].name).toBe('Squid Game');
		});

		it('discoverTV queries /discover/tv with TV filters', async () => {
			const mockDiscover: TMDBPaginatedResponse<TMDBTVShow> = {
				page: 1,
				total_pages: 5,
				total_results: 100,
				results: [
					{
						id: 202410,
						name: 'Queen of Tears',
						original_name: '눈물의 여왕',
						overview: 'A married couple faces a dizzying crisis.',
						first_air_date: '2024-03-09',
						genre_ids: [18, 35],
						origin_country: ['KR'],
						original_language: 'ko',
						vote_average: 8.7,
						vote_count: 500,
						poster_path: '/tears.jpg',
						backdrop_path: '/tears_bg.jpg'
					}
				]
			};

			const { fetch, getCapturedUrl } = mockFetch({
				'/discover/tv': mockDiscover
			});

			const result = await discoverTV(
				{
					with_genres: 18,
					first_air_date_year: 2024,
					with_original_language: 'ko',
					with_origin_country: 'KR',
					min_rating: 8.0,
					sort_by: 'vote_average.desc'
				},
				fetch
			);

			const captured = getCapturedUrl();
			expect(captured).toContain('/discover/tv');
			expect(captured).toContain('with_genres=18');
			expect(captured).toContain('first_air_date_year=2024');
			expect(captured).toContain('with_original_language=ko');
			expect(captured).toContain('with_origin_country=KR');
			expect(captured).toContain('vote_average.gte=8');
			expect(captured).toContain('sort_by=vote_average.desc');
			expect(result.results[0].name).toBe('Queen of Tears');
		});
	});

	describe('unifiedSearch Content-Type Routing', () => {
		it('routes contentType="tv" queries exclusively to TV endpoints', async () => {
			const mockTVResponse: TMDBPaginatedResponse<TMDBTVShow> = {
				page: 1,
				total_pages: 1,
				total_results: 1,
				results: [
					{
						id: 119051,
						name: 'Wednesday',
						overview: 'Wednesday Addams investigates a murder spree.',
						first_air_date: '2022-11-23',
						genre_ids: [10765, 9648, 35],
						origin_country: ['US'],
						original_language: 'en',
						vote_average: 8.5,
						vote_count: 8000,
						poster_path: '/wednesday.jpg',
						backdrop_path: null
					}
				]
			};

			const { fetch, getCapturedUrl } = mockFetch({
				'/search/tv': mockTVResponse,
				'/genre/tv/list': { genres: [{ id: 10765, name: 'Sci-Fi & Fantasy' }] },
				'/genre/movie/list': { genres: [] }
			});

			const result = await unifiedSearch(
				{
					query: 'Wednesday',
					contentType: 'tv'
				},
				fetch
			);

			expect(getCapturedUrl()).toContain('/search/tv');
			expect(result.tvShows).toHaveLength(1);
			expect(result.tvShows[0].name).toBe('Wednesday');
			expect(result.tvShows[0].mediaType).toBe('tv');
			expect(result.movies).toHaveLength(0);
			expect(result.people).toHaveLength(0);
		});

		it('routes contentType="tv" year discovery to discoverTV', async () => {
			const mockDiscover: TMDBPaginatedResponse<TMDBTVShow> = {
				page: 1,
				total_pages: 2,
				total_results: 30,
				results: [
					{
						id: 12345,
						name: '2024 Hit Series',
						first_air_date: '2024-05-01',
						genre_ids: [18],
						origin_country: ['US'],
						original_language: 'en',
						vote_average: 7.9,
						vote_count: 350,
						poster_path: null,
						backdrop_path: null
					}
				]
			};

			const { fetch, getCapturedUrl } = mockFetch({
				'/discover/tv': mockDiscover,
				'/genre/tv/list': { genres: [] },
				'/genre/movie/list': { genres: [] }
			});

			const result = await unifiedSearch(
				{
					query: '2024',
					contentType: 'tv'
				},
				fetch
			);

			expect(getCapturedUrl()).toContain('/discover/tv');
			expect(getCapturedUrl()).toContain('first_air_date_year=2024');
			expect(result.tvShows).toHaveLength(1);
			expect(result.movies).toHaveLength(0);
		});
	});
});
