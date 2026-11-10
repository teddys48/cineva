import { describe, it, expect, beforeEach } from 'bun:test';
import {
	mapTMDBTVDetailsToDetail,
	mapTMDBTVSeasonToSeasonDetail,
	clearCache,
	TMDBError
} from '../src/lib/server/tmdb';
import { load as loadTVDetail } from '../src/routes/tv/[id]/+page.server';
import { load as loadTVSeason } from '../src/routes/tv/[id]/season/[season_number]/+page.server';
import type {
	TMDBTVShowDetails,
	TMDBTVSeasonResponse,
	TMDBCreditsResponse,
	TMDBVideo,
	TMDBPaginatedResponse,
	TMDBTVShow
} from '../src/lib/types/tmdb';

function mockFetch(routes: Record<string, unknown>): typeof fetch {
	return (async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input.toString();

		// Match the most specific key first by sorting keys by length descending
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
}

describe('TV Detail & Season Backend Integration Tests', () => {
	beforeEach(() => {
		clearCache();
	});

	describe('mapTMDBTVDetailsToDetail', () => {
		it('accurately transforms raw TV details into Cineva TVDetail model', () => {
			const rawDetails: TMDBTVShowDetails = {
				id: 93405,
				name: 'Squid Game',
				original_name: '오징어 게임',
				tagline: '45.6 Billion Is Child’s Play',
				overview: 'Hundreds of cash-strapped players accept a strange invitation.',
				first_air_date: '2021-09-17',
				last_air_date: '2024-12-26',
				episode_run_time: [55, 60],
				genres: [
					{ id: 10759, name: 'Action & Adventure' },
					{ id: 18, name: 'Drama' },
					{ id: 9648, name: 'Mystery' }
				],
				status: 'Returning Series',
				type: 'Scripted',
				original_language: 'ko',
				origin_country: ['KR'],
				number_of_seasons: 2,
				number_of_episodes: 15,
				vote_average: 7.842,
				vote_count: 14500,
				poster_path: '/dDlGnu3IRWJn24h8V5E2bH7gq.jpg',
				backdrop_path: '/7q448SV2qr0tk8q8.jpg',
				networks: [
					{
						id: 213,
						name: 'Netflix',
						logo_path: '/wwemzKWzjKYJFfCeiB57q3r4Bcm.png',
						origin_country: 'US'
					}
				],
				production_companies: [
					{
						id: 156108,
						name: 'Firstman Studio',
						logo_path: null,
						origin_country: 'KR'
					}
				],
				created_by: [
					{
						id: 1128309,
						name: 'Hwang Dong-hyuk',
						original_name: '황동혁',
						profile_path: '/hwang.jpg'
					}
				],
				seasons: [
					{
						id: 131710,
						name: 'Season 1',
						overview: 'Secret games for high stakes.',
						season_number: 1,
						episode_count: 9,
						air_date: '2021-09-17',
						poster_path: '/s1.jpg'
					},
					{
						id: 341850,
						name: 'Season 2',
						overview: 'Gi-hun returns to the game.',
						season_number: 2,
						episode_count: 6,
						air_date: '2024-12-26',
						poster_path: '/s2.jpg'
					}
				]
			};

			const detail = mapTMDBTVDetailsToDetail(
				rawDetails,
				null, // credits
				null, // videos
				null, // content ratings
				null // gallery
			);

			expect(detail.id).toBe('93405');
			expect(detail.name).toBe('Squid Game');
			expect(detail.originalName).toBe('오징어 게임');
			expect(detail.tagline).toBe('45.6 Billion Is Child’s Play');
			expect(detail.firstAirYear).toBe(2021);
			expect(detail.lastAirYear).toBe(2024);
			expect(detail.numberOfSeasons).toBe(2);
			expect(detail.numberOfEpisodes).toBe(15);
			expect(detail.episodeRuntime).toBe('55m');
			expect(detail.status).toBe('Returning Series');
			expect(detail.originalLanguage).toBe('ko');
			expect(detail.originalLanguageName).toBe('Korean');
			expect(detail.rating).toBe(7.8);
			expect(detail.voteCount).toBe(14500);
			expect(detail.mediaType).toBe('tv');

			// Networks & Production Companies
			expect(detail.networks).toHaveLength(1);
			expect(detail.networks[0].name).toBe('Netflix');
			expect(detail.productionCompanies).toHaveLength(1);
			expect(detail.productionCompanies[0]).toBe('Firstman Studio');

			// Creators
			expect(detail.creators).toHaveLength(1);
			expect(detail.creators[0].name).toBe('Hwang Dong-hyuk');

			// Seasons
			expect(detail.seasons).toHaveLength(2);
			expect(detail.seasons[0].name).toBe('Season 1');
			expect(detail.seasons[0].episodeCount).toBe(9);
			expect(detail.seasons[1].seasonNumber).toBe(2);
		});

		it('handles TV shows with missing optional fields gracefully', () => {
			const minimalDetails: TMDBTVShowDetails = {
				id: 12345,
				name: 'Minimal Series',
				overview: 'Short description.',
				first_air_date: null,
				last_air_date: null,
				genres: [],
				status: 'Ended',
				original_language: 'en',
				origin_country: [],
				number_of_seasons: 1,
				number_of_episodes: 4,
				vote_average: 0,
				vote_count: 0,
				poster_path: null,
				backdrop_path: null
			};

			const detail = mapTMDBTVDetailsToDetail(minimalDetails);

			expect(detail.id).toBe('12345');
			expect(detail.name).toBe('Minimal Series');
			expect(detail.firstAirYear).toBeNull();
			expect(detail.lastAirYear).toBeUndefined();
			expect(detail.rating).toBeNull();
			expect(detail.tagline).toBeUndefined();
			expect(detail.creators).toEqual([]);
			expect(detail.networks).toEqual([]);
			expect(detail.seasons).toEqual([]);
		});
	});

	describe('mapTMDBTVSeasonToSeasonDetail', () => {
		it('transforms raw season and episode data correctly', () => {
			const rawSeason: TMDBTVSeasonResponse = {
				id: 131710,
				name: 'Season 1',
				season_number: 1,
				overview: 'The deadly games begin.',
				air_date: '2021-09-17',
				poster_path: '/season1_poster.jpg',
				episodes: [
					{
						id: 301234,
						name: 'Red Light, Green Light',
						episode_number: 1,
						season_number: 1,
						overview: 'Hoping to win easy money, Gi-hun agrees to play a game.',
						air_date: '2021-09-17',
						runtime: 60,
						still_path: '/still1.jpg',
						vote_average: 8.4,
						vote_count: 520,
						guest_stars: [
							{
								id: 991,
								name: 'Gong Yoo',
								character: 'The Salesman',
								profile_path: '/gong.jpg',
								order: 0
							}
						]
					},
					{
						id: 301235,
						name: 'Hell',
						episode_number: 2,
						season_number: 1,
						overview: 'Split on whether to continue or quit, the group holds a vote.',
						air_date: '2021-09-17',
						runtime: 63,
						still_path: null,
						vote_average: 7.9,
						vote_count: 410
					}
				]
			};

			const seasonDetail = mapTMDBTVSeasonToSeasonDetail(rawSeason, 93405, 'Squid Game');

			expect(seasonDetail.seriesId).toBe('93405');
			expect(seasonDetail.seriesName).toBe('Squid Game');
			expect(seasonDetail.seasonNumber).toBe(1);
			expect(seasonDetail.name).toBe('Season 1');
			expect(seasonDetail.episodes).toHaveLength(2);

			const ep1 = seasonDetail.episodes[0];
			expect(ep1.episodeNumber).toBe(1);
			expect(ep1.name).toBe('Red Light, Green Light');
			expect(ep1.runtime).toBe('1h');
			expect(ep1.stillUrl).toContain('/still1.jpg');
			expect(ep1.rating).toBe(8.4);
			expect(ep1.guestStars).toHaveLength(1);
			expect(ep1.guestStars![0].name).toBe('Gong Yoo');

			const ep2 = seasonDetail.episodes[1];
			expect(ep2.episodeNumber).toBe(2);
			expect(ep2.stillUrl).toBe('');
		});

		it('handles specials / season 0 properly', () => {
			const rawSpecials: TMDBTVSeasonResponse = {
				id: 9999,
				name: 'Specials',
				season_number: 0,
				overview: 'Behind the scenes and bonus episodes.',
				episodes: [
					{
						id: 8888,
						name: 'Making of Season 1',
						episode_number: 1,
						season_number: 0,
						overview: 'Director and cast interviews.',
						air_date: '2021-10-01',
						runtime: 45,
						still_path: null
					}
				]
			};

			const seasonDetail = mapTMDBTVSeasonToSeasonDetail(rawSpecials, 93405, 'Squid Game');
			expect(seasonDetail.seasonNumber).toBe(0);
			expect(seasonDetail.name).toBe('Specials');
			expect(seasonDetail.episodes).toHaveLength(1);
			expect(seasonDetail.episodes[0].episodeNumber).toBe(1);
		});
	});

	describe('Route Validation: /tv/[id]', () => {
		it('rejects non-numeric TV ID with 404', async () => {
			await expect(
				loadTVDetail({
					params: { id: 'not-a-number' },
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof loadTVDetail>[0])
			).rejects.toThrow();
		});

		it('rejects negative or zero TV ID with 404', async () => {
			await expect(
				loadTVDetail({
					params: { id: '0' },
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof loadTVDetail>[0])
			).rejects.toThrow();

			await expect(
				loadTVDetail({
					params: { id: '-5' },
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof loadTVDetail>[0])
			).rejects.toThrow();
		});

		it('handles TMDB 404 for unknown series with 404 error', async () => {
			const fetchFn = mockFetch({
				'/tv/999999': new TMDBError('Series not found', 404)
			});

			await expect(
				loadTVDetail({
					params: { id: '999999' },
					fetch: fetchFn,
					setHeaders: () => {}
				} as unknown as Parameters<typeof loadTVDetail>[0])
			).rejects.toThrow();
		});

		it('survives partial API failures when optional TV endpoints fail', async () => {
			const mockDetails: TMDBTVShowDetails = {
				id: 85271,
				name: 'WandaVision',
				overview: 'Living idealized suburban lives.',
				first_air_date: '2021-01-15',
				genres: [{ id: 10765, name: 'Sci-Fi & Fantasy' }],
				status: 'Ended',
				original_language: 'en',
				origin_country: ['US'],
				number_of_seasons: 1,
				number_of_episodes: 9,
				vote_average: 8.2,
				vote_count: 11000,
				poster_path: '/wandavision.jpg',
				backdrop_path: '/wandavision_bg.jpg'
			};

			const fetchFn = mockFetch({
				'/tv/85271/aggregate_credits': new TMDBError('Credits timeout', 504),
				'/tv/85271/videos': new TMDBError('Videos unavailable', 503),
				'/tv/85271/similar': new TMDBError('Similar failed', 500),
				'/tv/85271/recommendations': new TMDBError('Recommendations failed', 500),
				'/tv/85271/images': new TMDBError('Images timeout', 504),
				'/tv/85271/content_ratings': new TMDBError('Ratings fail', 500),
				'/tv/85271': mockDetails
			});

			const result = await loadTVDetail({
				params: { id: '85271' },
				fetch: fetchFn,
				setHeaders: () => {}
			} as unknown as Parameters<typeof loadTVDetail>[0]);

			expect(result.tvShow.name).toBe('WandaVision');
			expect(result.tvShow.cast).toEqual([]);
			expect(result.similar.items).toEqual([]);
			expect(result.recommendations.items).toEqual([]);
			expect(result.tvShow.trailer).toBeNull();
		});
	});

	describe('Route Validation: /tv/[id]/season/[season_number]', () => {
		it('rejects non-numeric series ID with 404', async () => {
			await expect(
				loadTVSeason({
					params: { id: 'invalid', season_number: '1' },
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof loadTVSeason>[0])
			).rejects.toThrow();
		});

		it('rejects invalid or negative season number with 404', async () => {
			await expect(
				loadTVSeason({
					params: { id: '93405', season_number: 'invalid' },
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof loadTVSeason>[0])
			).rejects.toThrow();

			await expect(
				loadTVSeason({
					params: { id: '93405', season_number: '-1' },
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof loadTVSeason>[0])
			).rejects.toThrow();
		});

		it('loads season 0 (specials) successfully', async () => {
			const mockSeries: TMDBTVShowDetails = {
				id: 93405,
				name: 'Squid Game',
				overview: 'Overview',
				genres: [],
				status: 'Returning Series',
				original_language: 'ko',
				origin_country: ['KR'],
				number_of_seasons: 2,
				number_of_episodes: 15,
				seasons: [
					{
						id: 999,
						name: 'Specials',
						season_number: 0,
						episode_count: 2,
						overview: 'Special clips'
					}
				]
			};

			const mockSeason: TMDBTVSeasonResponse = {
				id: 999,
				name: 'Specials',
				season_number: 0,
				overview: 'Special clips',
				episodes: [
					{
						id: 888,
						name: 'Behind the Scenes',
						episode_number: 1,
						season_number: 0,
						overview: 'Interviews',
						runtime: 30
					}
				]
			};

			const fetchFn = mockFetch({
				'/tv/93405/season/0': mockSeason,
				'/tv/93405': mockSeries
			});

			const result = await loadTVSeason({
				params: { id: '93405', season_number: '0' },
				fetch: fetchFn,
				setHeaders: () => {}
			} as unknown as Parameters<typeof loadTVSeason>[0]);

			expect(result.season.seasonNumber).toBe(0);
			expect(result.season.name).toBe('Specials');
			expect(result.series.name).toBe('Squid Game');
			expect(result.season.episodes).toHaveLength(1);
		});
	});
});
