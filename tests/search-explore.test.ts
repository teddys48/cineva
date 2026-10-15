import { describe, it, expect, beforeEach } from 'bun:test';
import {
	searchMovies,
	discoverMovies,
	getMovieGenres,
	clearCache,
	TMDB_GENRES,
	VALID_SORT_OPTIONS
} from '../src/lib/server/tmdb';
import type { TMDBPaginatedResponse, TMDBMovie, TMDBSortOption } from '../src/lib/types/tmdb';

describe('Search and Explore Backend Integration', () => {
	beforeEach(() => {
		clearCache();
	});

	describe('searchMovies', () => {
		it('returns empty results immediately for blank or whitespace query without network call', async () => {
			let fetchCalled = false;
			const mockFetch = async () => {
				fetchCalled = true;
				return new Response('{}', { status: 200 });
			};

			const emptyRes = await searchMovies({ query: '' }, mockFetch as unknown as typeof fetch);
			expect(emptyRes.results).toEqual([]);
			expect(emptyRes.total_results).toBe(0);
			expect(fetchCalled).toBe(false);

			const whitespaceRes = await searchMovies(
				{ query: '   \t  \n ' },
				mockFetch as unknown as typeof fetch
			);
			expect(whitespaceRes.results).toEqual([]);
			expect(fetchCalled).toBe(false);
		});

		it('sends correct request parameters for valid query and clamps page bounds', async () => {
			let calledUrl = '';
			const mockFetch = async (input: RequestInfo | URL) => {
				calledUrl = String(input);
				const payload: TMDBPaginatedResponse<TMDBMovie> = {
					page: 1,
					results: [
						{
							id: 157336,
							title: 'Interstellar',
							overview: 'A team of explorers travel through a wormhole in space.',
							poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
							backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
							vote_average: 8.4,
							vote_count: 36000,
							release_date: '2014-11-05'
						}
					],
					total_pages: 5,
					total_results: 95
				};
				return new Response(JSON.stringify(payload), { status: 200 });
			};

			const result = await searchMovies(
				{ query: '  Interstellar  ', page: 0 },
				mockFetch as unknown as typeof fetch
			);

			expect(result.results.length).toBe(1);
			expect(result.results[0].title).toBe('Interstellar');
			expect(calledUrl).toContain('/search/movie');
			expect(calledUrl).toContain('query=Interstellar');
			// Page 0 should be clamped to 1
			expect(calledUrl).toContain('page=1');
			expect(calledUrl).toContain('include_adult=false');
		});

		it('clamps upper page bound to 500 max per TMDB API limits', async () => {
			let calledUrl = '';
			const mockFetch = async (input: RequestInfo | URL) => {
				calledUrl = String(input);
				return new Response(
					JSON.stringify({ page: 500, results: [], total_pages: 1000, total_results: 20000 }),
					{ status: 200 }
				);
			};

			await searchMovies({ query: 'Space', page: 9999 }, mockFetch as unknown as typeof fetch);
			expect(calledUrl).toContain('page=500');
		});
	});

	describe('discoverMovies', () => {
		it('normalizes sort_by to popularity.desc when given an invalid sorting string', async () => {
			let calledUrl = '';
			const mockFetch = async (input: RequestInfo | URL) => {
				calledUrl = String(input);
				return new Response(
					JSON.stringify({ page: 1, results: [], total_pages: 1, total_results: 0 }),
					{ status: 200 }
				);
			};

			await discoverMovies(
				{ sort_by: 'unsupported_sort_value' as unknown as TMDBSortOption },
				mockFetch as unknown as typeof fetch
			);
			expect(calledUrl).toContain('sort_by=popularity.desc');
		});

		it('supports all valid sort options and enforces vote_count.gte for vote_average.desc', async () => {
			for (const sortOpt of VALID_SORT_OPTIONS) {
				let calledUrl = '';
				const mockFetch = async (input: RequestInfo | URL) => {
					calledUrl = String(input);
					return new Response(
						JSON.stringify({ page: 1, results: [], total_pages: 1, total_results: 0 }),
						{ status: 200 }
					);
				};

				await discoverMovies({ sort_by: sortOpt }, mockFetch as unknown as typeof fetch);
				expect(calledUrl).toContain(`sort_by=${encodeURIComponent(sortOpt)}`);

				if (sortOpt === 'vote_average.desc') {
					expect(calledUrl).toContain('vote_count.gte=100');
				}
			}
		});

		it('correctly maps genres, release year, and min rating filters', async () => {
			let calledUrl = '';
			const mockFetch = async (input: RequestInfo | URL) => {
				calledUrl = String(input);
				return new Response(
					JSON.stringify({ page: 1, results: [], total_pages: 1, total_results: 0 }),
					{ status: 200 }
				);
			};

			await discoverMovies(
				{
					with_genres: 28,
					primary_release_year: 2024,
					min_rating: 7.5,
					page: 2
				},
				mockFetch as unknown as typeof fetch
			);

			expect(calledUrl).toContain('with_genres=28');
			expect(calledUrl).toContain('primary_release_year=2024');
			expect(calledUrl).toContain('vote_average.gte=7.5');
			expect(calledUrl).toContain('vote_count.gte=10');
			expect(calledUrl).toContain('page=2');
		});

		it('ignores invalid release years and clamps rating to [0, 10]', async () => {
			let calledUrl = '';
			const mockFetch = async (input: RequestInfo | URL) => {
				calledUrl = String(input);
				return new Response(
					JSON.stringify({ page: 1, results: [], total_pages: 1, total_results: 0 }),
					{ status: 200 }
				);
			};

			await discoverMovies(
				{
					primary_release_year: 1700, // Invalid: before 1888
					min_rating: 15 // Clamped to 10
				},
				mockFetch as unknown as typeof fetch
			);

			expect(calledUrl).not.toContain('primary_release_year=1700');
			expect(calledUrl).toContain('vote_average.gte=10');
		});
	});

	describe('getMovieGenres', () => {
		it('fetches genres from TMDB and caches the response', async () => {
			let callCount = 0;
			const mockFetch = async () => {
				callCount++;
				return new Response(
					JSON.stringify({
						genres: [
							{ id: 28, name: 'Action' },
							{ id: 878, name: 'Sci-Fi' }
						]
					}),
					{ status: 200 }
				);
			};

			const genres1 = await getMovieGenres(mockFetch as unknown as typeof fetch);
			expect(genres1.length).toBe(2);
			expect(genres1[0].name).toBe('Action');
			expect(callCount).toBe(1);

			// Second call should hit in-memory cache
			const genres2 = await getMovieGenres(mockFetch as unknown as typeof fetch);
			expect(genres2.length).toBe(2);
			expect(callCount).toBe(1);
		});

		it('falls back gracefully to static TMDB_GENRES when network request fails', async () => {
			const mockFailingFetch = async () => {
				return new Response('Internal Server Error', { status: 500 });
			};

			const genres = await getMovieGenres(mockFailingFetch as unknown as typeof fetch);
			expect(genres.length).toBe(Object.keys(TMDB_GENRES).length);
			expect(genres.some((g) => g.id === 28 && g.name === 'Action')).toBe(true);
			expect(genres.some((g) => g.id === 878 && g.name === 'Sci-Fi')).toBe(true);
		});
	});

	describe('Explore and Search URL Parameter Consistency', () => {
		it('safely serializes and ignores default/empty parameters', () => {
			function serializeExploreUrl(filters: {
				genre?: string | number | null;
				year?: number | null;
				minRating?: number | null;
				sortBy?: string | null;
				page?: number | null;
			}): string {
				const params = new URLSearchParams();
				if (filters.genre) params.set('genre', String(filters.genre));
				if (filters.year) params.set('year', String(filters.year));
				if (filters.minRating) params.set('minRating', String(filters.minRating));
				if (filters.sortBy && filters.sortBy !== 'popularity.desc')
					params.set('sortBy', filters.sortBy);
				if (filters.page && filters.page > 1) params.set('page', String(filters.page));

				const q = params.toString();
				return q ? `/explore?${q}` : '/explore';
			}

			// Clean default state produces pure /explore
			expect(serializeExploreUrl({ sortBy: 'popularity.desc', page: 1 })).toBe('/explore');

			// Custom state produces correct query string
			expect(
				serializeExploreUrl({
					genre: 28,
					year: 2024,
					minRating: 7,
					sortBy: 'vote_average.desc',
					page: 3
				})
			).toBe('/explore?genre=28&year=2024&minRating=7&sortBy=vote_average.desc&page=3');
		});
	});
});
