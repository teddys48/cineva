import { describe, it, expect, beforeEach } from 'bun:test';
import {
	getMovieDetails,
	getMovieCredits,
	getMovieVideos,
	getSimilarMovies,
	getMovieRecommendations,
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

describe('Phase 4: Movie Detail Backend & Integration Tests', () => {
	beforeEach(() => {
		clearCache();
		process.env.TMDB_ACCESS_TOKEN = 'test_mock_token_12345';
	});

	describe('Profile Image & Formatting Utilities', () => {
		it('getProfileUrl returns empty string for missing paths', () => {
			expect(getProfileUrl(null)).toBe('');
			expect(getProfileUrl(undefined)).toBe('');
			expect(getProfileUrl('')).toBe('');
		});

		it('getProfileUrl constructs valid URL with default w185 and custom size', () => {
			expect(getProfileUrl('/actor123.jpg')).toBe('https://image.tmdb.org/t/p/w185/actor123.jpg');
			expect(getProfileUrl('actor123.jpg', 'h632')).toBe(
				'https://image.tmdb.org/t/p/h632/actor123.jpg'
			);
		});

		it('formatCurrency formats valid dollar amounts and returns undefined for 0 or negative', () => {
			expect(formatCurrency(165000000)).toBe('$165,000,000');
			expect(formatCurrency(25000)).toBe('$25,000');
			expect(formatCurrency(0)).toBeUndefined();
			expect(formatCurrency(-500)).toBeUndefined();
			expect(formatCurrency(null)).toBeUndefined();
			expect(formatCurrency(undefined)).toBeUndefined();
		});

		it('formatLanguageName transforms standard ISO codes into human readable names', () => {
			expect(formatLanguageName('en')).toBe('English');
			expect(formatLanguageName('fr')).toBe('French');
			expect(formatLanguageName('ja')).toBe('Japanese');
			expect(formatLanguageName('es')).toBe('Spanish');
			expect(formatLanguageName(null)).toBeUndefined();
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
			const vimeoOnly: TMDBVideo[] = [
				{
					id: 'v1',
					key: '12345',
					name: 'Vimeo Teaser',
					site: 'Vimeo',
					type: 'Trailer',
					official: true
				}
			];
			expect(selectBestTrailer(vimeoOnly)).toBeNull();
		});

		it('prioritizes official YouTube trailer over teaser and non-official', () => {
			const videos: TMDBVideo[] = [
				{
					id: 'v1',
					key: 'teaser_unofficial',
					name: 'Teaser Unofficial',
					site: 'YouTube',
					type: 'Teaser',
					official: false
				},
				{
					id: 'v2',
					key: 'trailer_unofficial',
					name: 'Trailer Unofficial',
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

			const selected = selectBestTrailer(videos);
			expect(selected).not.toBeNull();
			expect(selected?.key).toBe('trailer_official');
			expect(selected?.official).toBe(true);
		});

		it('falls back to unofficial trailer if no official trailer exists', () => {
			const videos: TMDBVideo[] = [
				{
					id: 'v1',
					key: 'teaser_clip',
					name: 'Teaser Clip',
					site: 'YouTube',
					type: 'Teaser',
					official: false
				},
				{
					id: 'v2',
					key: 'trailer_unofficial',
					name: 'Fan Trailer',
					site: 'YouTube',
					type: 'Trailer',
					official: false
				}
			];

			const selected = selectBestTrailer(videos);
			expect(selected?.key).toBe('trailer_unofficial');
		});

		it('falls back to official teaser when no trailer exists', () => {
			const videos: TMDBVideo[] = [
				{
					id: 'v1',
					key: 'teaser_official',
					name: 'Official Teaser',
					site: 'YouTube',
					type: 'Teaser',
					official: true
				}
			];

			const selected = selectBestTrailer(videos);
			expect(selected?.key).toBe('teaser_official');
		});
	});

	describe('mapTMDBMovieDetailsToDetail', () => {
		const rawDetails: TMDBMovieDetails = {
			id: 550,
			title: 'Fight Club',
			original_title: 'Fight Club',
			tagline: 'Mischief. Mayhem. Soap.',
			overview: 'An insomniac office worker...',
			release_date: '1999-10-15',
			runtime: 139,
			vote_average: 8.433,
			vote_count: 27000,
			status: 'Released',
			budget: 63000000,
			revenue: 100853753,
			poster_path: '/poster.jpg',
			backdrop_path: '/backdrop.jpg',
			original_language: 'en',
			genres: [{ id: 18, name: 'Drama' }],
			production_companies: [
				{ id: 508, name: 'Regency Enterprises', origin_country: 'US' },
				{ id: 711, name: 'Fox 2000 Pictures', origin_country: 'US' }
			],
			production_countries: [{ iso_3166_1: 'US', name: 'United States of America' }],
			homepage: 'http://www.foxmovies.com/fightclub',
			imdb_id: 'tt0137523'
		};

		const rawCredits: TMDBCreditsResponse = {
			id: 550,
			cast: [
				{
					id: 819,
					name: 'Edward Norton',
					character: 'The Narrator',
					order: 0,
					profile_path: '/norton.jpg'
				},
				{
					id: 287,
					name: 'Brad Pitt',
					character: 'Tyler Durden',
					order: 1,
					profile_path: '/pitt.jpg'
				}
			],
			crew: [
				{
					id: 7467,
					name: 'David Fincher',
					job: 'Director',
					department: 'Directing',
					profile_path: '/fincher.jpg'
				},
				{
					id: 1254,
					name: 'Jim Uhls',
					job: 'Screenplay',
					department: 'Writing'
				},
				{
					id: 288,
					name: 'Art Linson',
					job: 'Producer',
					department: 'Production'
				},
				{
					id: 7468,
					name: 'Jeff Cronenweth',
					job: 'Director of Photography',
					department: 'Camera'
				}
			]
		};

		const rawVideos: TMDBVideo[] = [
			{
				id: 'vid1',
				key: 'O1nDozs-Lda',
				name: 'Official Trailer',
				site: 'YouTube',
				type: 'Trailer',
				official: true
			}
		];

		it('accurately transforms raw details into Scenora MovieDetail model', () => {
			const detail = mapTMDBMovieDetailsToDetail(rawDetails, rawCredits, rawVideos);

			expect(detail.id).toBe('550');
			expect(detail.title).toBe('Fight Club');
			expect(detail.originalTitle).toBeUndefined(); // identical to title
			expect(detail.tagline).toBe('Mischief. Mayhem. Soap.');
			expect(detail.releaseYear).toBe(1999);
			expect(detail.runtime).toBe('2h 19m');
			expect(detail.rating).toBe(8.4);
			expect(detail.director).toBe('David Fincher');
			expect(detail.budgetText).toBe('$63,000,000');
			expect(detail.revenueText).toBe('$100,853,753');
			expect(detail.originalLanguage).toBe('English');
			expect(detail.cast.length).toBe(2);
			expect(detail.cast[0].name).toBe('Edward Norton');
			expect(detail.keyCrew.directors).toEqual(['David Fincher']);
			expect(detail.keyCrew.screenplay).toEqual(['Jim Uhls']);
			expect(detail.keyCrew.producers).toEqual(['Art Linson']);
			expect(detail.keyCrew.cinematography).toEqual(['Jeff Cronenweth']);
			expect(detail.trailer?.key).toBe('O1nDozs-Lda');
		});

		it('preserves originalTitle when different from localized title', () => {
			const foreignMovie: TMDBMovieDetails = {
				...rawDetails,
				title: 'Spirited Away',
				original_title: '千と千尋の神隠し',
				original_language: 'ja'
			};

			const detail = mapTMDBMovieDetailsToDetail(foreignMovie, null, null);
			expect(detail.title).toBe('Spirited Away');
			expect(detail.originalTitle).toBe('千と千尋の神隠し');
			expect(detail.originalLanguage).toBe('Japanese');
		});

		it('gracefully handles missing credits and empty video list', () => {
			const detail = mapTMDBMovieDetailsToDetail(rawDetails, null, null);
			expect(detail.cast).toEqual([]);
			expect(detail.crew).toEqual([]);
			expect(detail.keyCrew.directors).toEqual([]);
			expect(detail.trailer).toBeNull();
			expect(detail.videos).toEqual([]);
		});
	});

	describe('Page Server Load Route Validation and Partial Failures', () => {
		const mockFetch = (responses: Record<string, unknown>) => {
			return (async (input: RequestInfo | URL) => {
				const url = input.toString();
				for (const [pattern, data] of Object.entries(responses)) {
					if (url.includes(pattern)) {
						if (data instanceof Error) {
							return new Response(JSON.stringify({ status_message: data.message }), {
								status: (data as TMDBError).status || 500,
								headers: { 'content-type': 'application/json' }
							});
						}
						return new Response(JSON.stringify(data), {
							status: 200,
							headers: { 'content-type': 'application/json' }
						});
					}
				}
				return new Response(JSON.stringify({ status_message: 'Resource not found' }), {
					status: 404,
					headers: { 'content-type': 'application/json' }
				});
			}) as unknown as typeof fetch;
		};

		it('rejects non-numeric movie ID with 404', async () => {
			await expect(
				load({
					params: { id: 'invalid-id' },
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as any)
			).rejects.toThrow();
		});

		it('rejects negative or 0 movie ID with 404', async () => {
			await expect(
				load({
					params: { id: '0' },
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as any)
			).rejects.toThrow();

			await expect(
				load({
					params: { id: '-55' },
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as any)
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
				} as any)
			).rejects.toThrow();
		});

		it('renders movie details even when optional endpoints (credits, videos, similar) fail', async () => {
			const mockDetails: TMDBMovieDetails = {
				id: 100,
				title: 'Resilient Film',
				overview: 'This film loads even if optional endpoints fail.',
				release_date: '2024-05-10',
				vote_average: 7.8,
				vote_count: 500,
				poster_path: '/resilient.jpg',
				backdrop_path: '/resilient_bg.jpg'
			};

			const fetchFn = mockFetch({
				'/movie/100/credits': new TMDBError('Credits service timeout', 504),
				'/movie/100/videos': new TMDBError('Videos service error', 500),
				'/movie/100/similar': new TMDBError('Similar service unavailable', 503),
				'/movie/100/recommendations': new TMDBError('Recommendations error', 500),
				'/movie/100': mockDetails
			});

			const result = await load({
				params: { id: '100' },
				fetch: fetchFn,
				setHeaders: () => {}
			} as any);

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
			} as any);

			// Current movie 50 filtered out from similar
			expect(result.similar.movies.length).toBe(1);
			expect(result.similar.movies[0].id).toBe('51');

			// Recommendation 51 deduplicated; 52 retained
			expect(result.recommendations.movies.length).toBe(1);
			expect(result.recommendations.movies[0].id).toBe('52');
		});
	});
});
