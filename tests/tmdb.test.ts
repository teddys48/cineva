import { describe, it, expect, beforeEach } from 'bun:test';
import {
	getPosterUrl,
	getBackdropUrl,
	formatRuntime,
	parseReleaseDate,
	mapTMDBMovieToMovie,
	tmdbFetch,
	TMDBError,
	clearCache,
	TMDB_GENRES
} from '../src/lib/server/tmdb';
import type { TMDBMovie } from '../src/lib/types/tmdb';

describe('TMDB Utility Functions', () => {
	beforeEach(() => {
		clearCache();
	});

	describe('TMDB_GENRES', () => {
		it('contains standard genre mappings', () => {
			expect(TMDB_GENRES[28]).toBe('Action');
			expect(TMDB_GENRES[878]).toBe('Sci-Fi');
			expect(TMDB_GENRES[18]).toBe('Drama');
		});
	});

	describe('getPosterUrl', () => {
		it('returns empty string for null or undefined path', () => {
			expect(getPosterUrl(null)).toBe('');
			expect(getPosterUrl(undefined)).toBe('');
			expect(getPosterUrl('')).toBe('');
		});

		it('constructs correct poster URL with default w500 size', () => {
			expect(getPosterUrl('/poster123.jpg')).toBe('https://image.tmdb.org/t/p/w500/poster123.jpg');
		});

		it('handles path without leading slash', () => {
			expect(getPosterUrl('poster123.jpg')).toBe('https://image.tmdb.org/t/p/w500/poster123.jpg');
		});

		it('supports custom size parameters', () => {
			expect(getPosterUrl('/poster123.jpg', 'w780')).toBe(
				'https://image.tmdb.org/t/p/w780/poster123.jpg'
			);
			expect(getPosterUrl('/poster123.jpg', 'original')).toBe(
				'https://image.tmdb.org/t/p/original/poster123.jpg'
			);
		});
	});

	describe('getBackdropUrl', () => {
		it('returns empty string for missing path', () => {
			expect(getBackdropUrl(null)).toBe('');
			expect(getBackdropUrl(undefined)).toBe('');
		});

		it('constructs correct backdrop URL with default w1280 size', () => {
			expect(getBackdropUrl('/backdrop456.jpg')).toBe(
				'https://image.tmdb.org/t/p/w1280/backdrop456.jpg'
			);
		});

		it('supports custom size parameter', () => {
			expect(getBackdropUrl('/backdrop456.jpg', 'original')).toBe(
				'https://image.tmdb.org/t/p/original/backdrop456.jpg'
			);
		});
	});

	describe('formatRuntime', () => {
		it('returns undefined for 0, negative, or undefined minutes', () => {
			expect(formatRuntime(undefined)).toBeUndefined();
			expect(formatRuntime(null)).toBeUndefined();
			expect(formatRuntime(0)).toBeUndefined();
			expect(formatRuntime(-10)).toBeUndefined();
		});

		it('formats hours and minutes correctly', () => {
			expect(formatRuntime(145)).toBe('2h 25m');
			expect(formatRuntime(120)).toBe('2h');
			expect(formatRuntime(55)).toBe('55m');
		});
	});

	describe('parseReleaseDate', () => {
		it('handles null, empty, or invalid dates', () => {
			expect(parseReleaseDate(null)).toEqual({ year: null });
			expect(parseReleaseDate('')).toEqual({ year: null });
			expect(parseReleaseDate('invalid-date')).toEqual({ year: null });
			expect(parseReleaseDate('1800-01-01')).toEqual({ year: null });
		});

		it('extracts year and formats date string accurately', () => {
			const res = parseReleaseDate('2026-07-29');
			expect(res.year).toBe(2026);
			expect(res.dateText).toBeDefined();
			expect(res.dateText).toContain('2026');
		});
	});

	describe('mapTMDBMovieToMovie', () => {
		const sampleTMDBMovie: TMDBMovie = {
			id: 969681,
			title: 'Spider-Man: Brand New Day',
			overview: 'Peter Parker faces a new threat.',
			poster_path: '/poster.jpg',
			backdrop_path: '/backdrop.jpg',
			release_date: '2026-07-29',
			vote_average: 8.458,
			vote_count: 5445,
			genre_ids: [878, 28]
		};

		it('maps raw TMDB movie to Cineva Movie interface correctly', () => {
			const movie = mapTMDBMovieToMovie(sampleTMDBMovie);

			expect(movie.id).toBe('969681');
			expect(movie.title).toBe('Spider-Man: Brand New Day');
			expect(movie.overview).toBe('Peter Parker faces a new threat.');
			expect(movie.releaseYear).toBe(2026);
			expect(movie.rating).toBe(8.5);
			expect(movie.voteCount).toBe(5445);
			expect(movie.genres).toEqual(['Sci-Fi', 'Action']);
			expect(movie.posterUrl).toBe('https://image.tmdb.org/t/p/w500/poster.jpg');
			expect(movie.backdropUrl).toBe('https://image.tmdb.org/t/p/w1280/backdrop.jpg');
			expect(movie.isUpcoming).toBeUndefined();
		});

		it('handles unrated movies without presenting 0.0 rating', () => {
			const unratedMovie: TMDBMovie = {
				id: 12345,
				title: 'Future Unreleased Film',
				overview: 'Coming soon.',
				poster_path: null,
				backdrop_path: null,
				release_date: '2027-01-15',
				vote_average: 0,
				vote_count: 0
			};

			const mapped = mapTMDBMovieToMovie(unratedMovie, { isUpcoming: true });
			expect(mapped.rating).toBeNull();
			expect(mapped.isUpcoming).toBe(true);
			expect(mapped.posterUrl).toBe('');
			expect(mapped.backdropUrl).toBe('');
		});

		it('maps genre objects if genres array is provided instead of genre_ids', () => {
			const movieWithGenreObjs: TMDBMovie = {
				id: 999,
				title: 'Detailed Movie',
				overview: 'Detailed overview.',
				poster_path: null,
				backdrop_path: null,
				vote_average: 7.2,
				vote_count: 100,
				genres: [
					{ id: 18, name: 'Drama' },
					{ id: 53, name: 'Thriller' }
				]
			};

			const mapped = mapTMDBMovieToMovie(movieWithGenreObjs, {
				director: 'Jane Campion',
				runtime: '2h 10m'
			});

			expect(mapped.genres).toEqual(['Drama', 'Thriller']);
			expect(mapped.director).toBe('Jane Campion');
			expect(mapped.runtime).toBe('2h 10m');
		});
	});

	describe('TMDBError', () => {
		it('correctly sets error properties and name', () => {
			const err = new TMDBError('Rate limit exceeded', 429, '/movie/popular');
			expect(err.name).toBe('TMDBError');
			expect(err.message).toBe('Rate limit exceeded');
			expect(err.status).toBe(429);
			expect(err.endpoint).toBe('/movie/popular');
		});
	});

	describe('tmdbFetch with mock fetch', () => {
		it('returns parsed JSON and caches subsequent calls', async () => {
			let callCount = 0;
			const mockFetch = async () => {
				callCount++;
				return new Response(
					JSON.stringify({ page: 1, results: [{ id: 1, title: 'Cached Movie' }] }),
					{
						status: 200,
						headers: { 'content-type': 'application/json' }
					}
				);
			};

			const first = await tmdbFetch<{ page: number; results: { id: number; title: string }[] }>(
				'/test/cache',
				{ page: 1 },
				mockFetch as unknown as typeof fetch
			);
			expect(first.results[0].title).toBe('Cached Movie');
			expect(callCount).toBe(1);

			// Second call with same endpoint and params should use cache
			const second = await tmdbFetch<{ page: number; results: { id: number; title: string }[] }>(
				'/test/cache',
				{ page: 1 },
				mockFetch as unknown as typeof fetch
			);
			expect(second.results[0].title).toBe('Cached Movie');
			expect(callCount).toBe(1);
		});

		it('handles HTTP error responses gracefully', async () => {
			const mockFetch = async () => {
				return new Response(
					JSON.stringify({ status_message: 'Invalid API key: You must be granted a valid key.' }),
					{ status: 401, headers: { 'content-type': 'application/json' } }
				);
			};

			await expect(
				tmdbFetch('/test/error', {}, mockFetch as unknown as typeof fetch)
			).rejects.toThrow('Invalid API key: You must be granted a valid key.');
		});
	});

	describe('Partial Failure Handling', () => {
		it('ensures independent sections resolve concurrently without failing together', async () => {
			const fetchSectionSuccess = async () => {
				return { results: [{ id: 1, title: 'Success Movie', vote_count: 10, vote_average: 8.0 }] };
			};

			const fetchSectionFailure = async () => {
				throw new TMDBError('Service unavailable', 503, '/movie/failing');
			};

			const [sectionA, sectionB] = await Promise.allSettled([
				fetchSectionSuccess(),
				fetchSectionFailure()
			]);

			expect(sectionA.status).toBe('fulfilled');
			expect(sectionB.status).toBe('rejected');

			if (sectionA.status === 'fulfilled') {
				expect(sectionA.value.results.length).toBe(1);
			}
			if (sectionB.status === 'rejected') {
				expect(sectionB.reason.message).toContain('Service unavailable');
			}
		});
	});
});
