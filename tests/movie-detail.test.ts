import { describe, it, expect, beforeEach } from 'bun:test';
import {
	getProfileUrl,
	formatCurrency,
	formatLanguageName,
	selectBestTrailer,
	mapTMDBMovieDetailsToDetail,
	clearCache,
	TMDBError
} from '../src/lib/server/tmdb';
import { load } from '../src/routes/movie/[id]/+page.server';
import type {
	TMDBMovieDetails,
	TMDBCreditsResponse,
	TMDBVideo,
	TMDBPaginatedResponse,
	TMDBMovie
} from '../src/lib/types/tmdb';

function mockFetch(routes: Record<string, unknown>): typeof fetch {
	return (async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input.toString();

		for (const [pattern, responseData] of Object.entries(routes)) {
			if (url.includes(pattern)) {
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

describe('Phase 4: Movie Detail Backend & Integration Tests', () => {
	beforeEach(() => {
		clearCache();
	});

	describe('Profile Image & Formatting Utilities', () => {
		it('getProfileUrl returns empty string for missing paths', () => {
			expect(getProfileUrl(null)).toBe('');
			expect(getProfileUrl(undefined)).toBe('');
			expect(getProfileUrl('')).toBe('');
		});

		it('getProfileUrl constructs valid URL with default w185 and custom size', () => {
			expect(getProfileUrl('/cast123.jpg')).toBe('https://image.tmdb.org/t/p/w185/cast123.jpg');
			expect(getProfileUrl('cast123.jpg', 'h632')).toBe(
				'https://image.tmdb.org/t/p/h632/cast123.jpg'
			);
		});

		it('formatCurrency formats valid dollar amounts and returns undefined for 0 or negative', () => {
			expect(formatCurrency(0)).toBeUndefined();
			expect(formatCurrency(-500)).toBeUndefined();
			expect(formatCurrency(undefined)).toBeUndefined();
			expect(formatCurrency(165000000)).toBe('$165,000,000');
			expect(formatCurrency(1250000)).toBe('$1,250,000');
		});

		it('formatLanguageName transforms standard ISO codes into human readable names', () => {
			expect(formatLanguageName('en')).toBe('English');
			expect(formatLanguageName('ja')).toBe('Japanese');
			expect(formatLanguageName('fr')).toBe('French');
			expect(formatLanguageName('ko')).toBe('Korean');
			expect(formatLanguageName('es')).toBe('Spanish');
			expect(formatLanguageName(undefined)).toBeUndefined();
			expect(formatLanguageName('')).toBeUndefined();
		});
	});

	describe('Trailer Selection Algorithm', () => {
		it('returns null when videos array is null, undefined, or empty', () => {
			expect(selectBestTrailer(null)).toBeNull();
			expect(selectBestTrailer(undefined)).toBeNull();
			expect(selectBestTrailer([])).toBeNull();
		});

		it('ignores non-YouTube videos', () => {
			const videos: TMDBVideo[] = [
				{
					id: 'v1',
					key: 'video1',
					name: 'Vimeo Trailer',
					site: 'Vimeo',
					type: 'Trailer',
					official: true
				}
			];
			expect(selectBestTrailer(videos)).toBeNull();
		});

		it('prioritizes official YouTube trailer over teaser and non-official', () => {
			const videos: TMDBVideo[] = [
				{
					id: 'v1',
					key: 'teaser_official',
					name: 'Official Teaser',
					site: 'YouTube',
					type: 'Teaser',
					official: true
				},
				{
					id: 'v2',
					key: 'trailer_fan',
					name: 'Fan Trailer',
					site: 'YouTube',
					type: 'Trailer',
					official: false
				},
				{
					id: 'v3',
					key: 'trailer_official',
					name: 'Official Main Trailer',
					site: 'YouTube',
					type: 'Trailer',
					official: true
				}
			];
			const best = selectBestTrailer(videos);
			expect(best?.key).toBe('trailer_official');
			expect(best?.official).toBe(true);
			expect(best?.type).toBe('Trailer');
		});

		it('falls back to unofficial trailer if no official trailer exists', () => {
			const videos: TMDBVideo[] = [
				{
					id: 'v1',
					key: 'clip_official',
					name: 'Official Clip',
					site: 'YouTube',
					type: 'Clip',
					official: true
				},
				{
					id: 'v2',
					key: 'unofficial_trailer',
					name: 'Preview Trailer',
					site: 'YouTube',
					type: 'Trailer',
					official: false
				}
			];
			const best = selectBestTrailer(videos);
			expect(best?.key).toBe('unofficial_trailer');
			expect(best?.type).toBe('Trailer');
		});

		it('falls back to official teaser when no trailer exists', () => {
			const videos: TMDBVideo[] = [
				{
					id: 'v1',
					key: 'official_teaser',
					name: 'First Look Teaser',
					site: 'YouTube',
					type: 'Teaser',
					official: true
				},
				{
					id: 'v2',
					key: 'featurette',
					name: 'Behind the Scenes',
					site: 'YouTube',
					type: 'Featurette',
					official: true
				}
			];
			const best = selectBestTrailer(videos);
			expect(best?.key).toBe('official_teaser');
			expect(best?.type).toBe('Teaser');
		});
	});

	describe('mapTMDBMovieDetailsToDetail', () => {
		const rawMovie: TMDBMovieDetails = {
			id: 157336,
			title: 'Interstellar',
			original_title: 'Interstellar',
			overview: 'A team of explorers travel through a wormhole in space.',
			poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
			backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
			release_date: '2014-11-05',
			vote_average: 8.412,
			vote_count: 34120,
			genres: [
				{ id: 12, name: 'Adventure' },
				{ id: 18, name: 'Drama' },
				{ id: 878, name: 'Science Fiction' }
			],
			runtime: 169,
			budget: 165000000,
			revenue: 701729206,
			status: 'Released',
			original_language: 'en',
			imdb_id: 'tt0816692',
			homepage: 'http://www.interstellarmovie.net',
			tagline: 'Mankind was born on Earth. It was never meant to die here.',
			production_companies: [
				{
					id: 9298,
					name: 'Syncopy',
					logo_path: '/syncopy.png',
					origin_country: 'GB'
				},
				{
					id: 9996,
					name: 'Legendary Pictures',
					logo_path: '/legendary.png',
					origin_country: 'US'
				}
			],
			production_countries: [
				{ iso_3166_1: 'GB', name: 'United Kingdom' },
				{ iso_3166_1: 'US', name: 'United States of America' }
			]
		};

		const rawCredits: TMDBCreditsResponse = {
			id: 157336,
			cast: [
				{
					id: 10297,
					name: 'Matthew McConaughey',
					character: 'Joseph Cooper',
					profile_path: '/matthew.jpg',
					order: 0
				},
				{
					id: 1813,
					name: 'Anne Hathaway',
					character: 'Dr. Amelia Brand',
					profile_path: '/anne.jpg',
					order: 1
				}
			],
			crew: [
				{
					id: 525,
					name: 'Christopher Nolan',
					job: 'Director',
					department: 'Directing',
					profile_path: '/nolan.jpg'
				},
				{
					id: 525,
					name: 'Christopher Nolan',
					job: 'Writer',
					department: 'Writing',
					profile_path: '/nolan.jpg'
				},
				{
					id: 7056,
					name: 'Jonathan Nolan',
					job: 'Screenplay',
					department: 'Writing',
					profile_path: '/jonathan.jpg'
				},
				{
					id: 559,
					name: 'Emma Thomas',
					job: 'Producer',
					department: 'Production',
					profile_path: '/emma.jpg'
				},
				{
					id: 947,
					name: 'Hoyte van Hoytema',
					job: 'Director of Photography',
					department: 'Camera',
					profile_path: '/hoyte.jpg'
				}
			]
		};

		const rawVideos: TMDBVideo[] = [
			{
				id: '579b362092514101e4000305',
				key: 'zSWdZVtXT7E',
				name: 'Official Trailer #3',
				site: 'YouTube',
				type: 'Trailer',
				official: true,
				published_at: '2014-07-30T17:58:39.000Z'
			}
		];

		it('accurately transforms raw details into Cineva MovieDetail model', () => {
			const detail = mapTMDBMovieDetailsToDetail(rawMovie, rawCredits, rawVideos);

			expect(detail.id).toBe('157336');
			expect(detail.title).toBe('Interstellar');
			expect(detail.releaseYear).toBe(2014);
			expect(detail.rating).toBe(8.4);
			expect(detail.voteCount).toBe(34120);
			expect(detail.runtime).toBe('2h 49m');
			expect(detail.budgetText).toBe('$165,000,000');
			expect(detail.revenueText).toBe('$701,729,206');
			expect(detail.originalLanguage).toBe('English');
			expect(detail.director).toBe('Christopher Nolan');
			expect(detail.keyCrew.directors).toEqual(['Christopher Nolan']);
			expect(detail.keyCrew.screenplay).toContain('Jonathan Nolan');
			expect(detail.keyCrew.screenplay).toContain('Christopher Nolan');
			expect(detail.keyCrew.producers).toEqual(['Emma Thomas']);
			expect(detail.keyCrew.cinematography).toEqual(['Hoyte van Hoytema']);
			expect(detail.productionCompanies).toEqual(['Syncopy', 'Legendary Pictures']);
			expect(detail.productionCountries).toEqual(['United Kingdom', 'United States of America']);

			// Cast mapping
			expect(detail.cast).toHaveLength(2);
			expect(detail.cast[0].name).toBe('Matthew McConaughey');
			expect(detail.cast[0].character).toBe('Joseph Cooper');
			expect(detail.cast[0].profileUrl).toBe('https://image.tmdb.org/t/p/w185/matthew.jpg');

			// Trailer mapping
			expect(detail.trailer?.key).toBe('zSWdZVtXT7E');
			expect(detail.trailer?.official).toBe(true);
		});

		it('preserves originalTitle when different from localized title', () => {
			const foreignMovie: TMDBMovieDetails = {
				...rawMovie,
				id: 129,
				title: 'Spirited Away',
				original_title: '千と千尋の神隠し',
				original_language: 'ja'
			};

			const detail = mapTMDBMovieDetailsToDetail(foreignMovie);
			expect(detail.title).toBe('Spirited Away');
			expect(detail.originalTitle).toBe('千と千尋の神隠し');
			expect(detail.originalLanguage).toBe('Japanese');
		});

		it('gracefully handles missing credits and empty video list', () => {
			const detail = mapTMDBMovieDetailsToDetail(rawMovie);

			expect(detail.cast).toEqual([]);
			expect(detail.crew).toEqual([]);
			expect(detail.keyCrew.directors).toEqual([]);
			expect(detail.trailer).toBeNull();
			expect(detail.videos).toEqual([]);
		});
	});

	describe('Page Server Load Route Validation and Partial Failures', () => {
		it('rejects non-numeric movie ID with 404', async () => {
			await expect(
				load({
					params: { id: 'invalid-id' },
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof load>[0])
			).rejects.toThrow();
		});

		it('rejects negative or 0 movie ID with 404', async () => {
			await expect(
				load({
					params: { id: '0' },
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof load>[0])
			).rejects.toThrow();

			await expect(
				load({
					params: { id: '-55' },
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof load>[0])
			).rejects.toThrow();
		});

		it('handles TMDB 404 response for unknown movie with proper not found error', async () => {
			const fetchFn = mockFetch({
				'/movie/9999999': new TMDBError('The resource you requested could not be found.', 404)
			});

			await expect(
				load({
					params: { id: '9999999' },
					fetch: fetchFn,
					setHeaders: () => {}
				} as unknown as Parameters<typeof load>[0])
			).rejects.toThrow();
		});

		it('renders movie details even when optional endpoints (credits, videos, similar) fail', async () => {
			const mockDetails: TMDBMovieDetails = {
				id: 100,
				title: 'Resilient Film',
				overview: 'Film that succeeds despite partial API outage.',
				release_date: '2024-05-10',
				vote_average: 7.2,
				vote_count: 50,
				poster_path: '/poster.jpg',
				backdrop_path: '/backdrop.jpg'
			};

			const fetchFn = mockFetch({
				'/movie/100/credits': new TMDBError('Credits error', 500),
				'/movie/100/videos': new TMDBError('Videos error', 500),
				'/movie/100/similar': new TMDBError('Similar error', 500),
				'/movie/100/recommendations': new TMDBError('Recommendations error', 500),
				'/movie/100': mockDetails
			});

			const result = await load({
				params: { id: '100' },
				fetch: fetchFn,
				setHeaders: () => {}
			} as unknown as Parameters<typeof load>[0]);

			expect(result.movie.title).toBe('Resilient Film');
			expect(result.movie.id).toBe('100');
			expect(result.similar.movies).toEqual([]);
			expect(result.similar.error).toContain('could not be retrieved');
			expect(result.recommendations.movies).toEqual([]);
			expect(result.recommendations.error).toContain('could not be retrieved');
		});

		it('deduplicates similar and recommended titles, filtering out currently viewed film', async () => {
			const mockDetails: TMDBMovieDetails = {
				id: 50,
				title: 'Current Feature',
				overview: 'Currently viewed movie.',
				release_date: '2023-01-01',
				vote_average: 8.0,
				vote_count: 1000,
				poster_path: '/current.jpg',
				backdrop_path: '/current_bg.jpg'
			};

			const mockSimilar: TMDBPaginatedResponse<TMDBMovie> = {
				page: 1,
				total_pages: 1,
				total_results: 2,
				results: [
					{
						id: 50, // Should be filtered out because it matches current movie
						title: 'Current Feature',
						overview: 'Duplicate of current',
						vote_average: 8.0,
						vote_count: 1000,
						poster_path: null,
						backdrop_path: null
					},
					{
						id: 51,
						title: 'Similar Film 1',
						overview: 'Shared themes',
						vote_average: 7.5,
						vote_count: 200,
						poster_path: null,
						backdrop_path: null
					}
				]
			};

			const mockRecs: TMDBPaginatedResponse<TMDBMovie> = {
				page: 1,
				total_pages: 1,
				total_results: 3,
				results: [
					{
						id: 51, // Already in similar, should be deduplicated
						title: 'Similar Film 1',
						overview: 'Shared themes',
						vote_average: 7.5,
						vote_count: 200,
						poster_path: null,
						backdrop_path: null
					},
					{
						id: 52,
						title: 'Fresh Recommended Film',
						overview: 'Novel recommendation',
						vote_average: 8.1,
						vote_count: 450,
						poster_path: null,
						backdrop_path: null
					}
				]
			};

			const fetchFn = mockFetch({
				'/movie/50/credits': { id: 50, cast: [], crew: [] },
				'/movie/50/videos': { id: 50, results: [] },
				'/movie/50/similar': mockSimilar,
				'/movie/50/recommendations': mockRecs,
				'/movie/50': mockDetails
			});

			const result = await load({
				params: { id: '50' },
				fetch: fetchFn,
				setHeaders: () => {}
			} as unknown as Parameters<typeof load>[0]);

			// Current movie 50 filtered out from similar
			expect(result.similar.movies.length).toBe(1);
			expect(result.similar.movies[0].id).toBe('51');

			// Recommendation 51 deduplicated; 52 retained
			expect(result.recommendations.movies.length).toBe(1);
			expect(result.recommendations.movies[0].id).toBe('52');
		});
	});
});
