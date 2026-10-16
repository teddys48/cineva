import { describe, it, expect, beforeEach } from 'bun:test';
import {
	getLogoUrl,
	getTMDBImageUrl,
	getMovieImages,
	normalizeTMDBImages,
	clearCache,
	TMDBError
} from '../src/lib/server/tmdb';
import { load } from '../src/routes/movie/[id]/+page.server';
import type { TMDBMovieDetails, TMDBMovieImagesResponse } from '../src/lib/types/tmdb';

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

describe('TMDB Movie Artwork Gallery', () => {
	beforeEach(() => {
		clearCache();
	});

	describe('Artwork URL Helpers', () => {
		it('getLogoUrl returns empty string for missing or empty paths', () => {
			expect(getLogoUrl(null)).toBe('');
			expect(getLogoUrl(undefined)).toBe('');
			expect(getLogoUrl('')).toBe('');
		});

		it('getLogoUrl constructs correct logo URL with default w300 and custom sizes', () => {
			expect(getLogoUrl('/logo.png')).toBe('https://image.tmdb.org/t/p/w300/logo.png');
			expect(getLogoUrl('logo.png', 'w500')).toBe('https://image.tmdb.org/t/p/w500/logo.png');
			expect(getLogoUrl('/logo.png', 'original')).toBe(
				'https://image.tmdb.org/t/p/original/logo.png'
			);
		});

		it('getTMDBImageUrl builds generic TMDB asset URLs with custom size', () => {
			expect(getTMDBImageUrl('/asset.jpg', 'w1280')).toBe(
				'https://image.tmdb.org/t/p/w1280/asset.jpg'
			);
			expect(getTMDBImageUrl('asset.jpg', 'original')).toBe(
				'https://image.tmdb.org/t/p/original/asset.jpg'
			);
			expect(getTMDBImageUrl(null)).toBe('');
		});
	});

	describe('getMovieImages Client Fetcher', () => {
		it('fetches images with default include_image_language="en,id,null"', async () => {
			let capturedUrl = '';
			const mockImages: TMDBMovieImagesResponse = {
				id: 550,
				backdrops: [
					{
						aspect_ratio: 1.778,
						height: 1080,
						width: 1920,
						file_path: '/fightclub_backdrop.jpg',
						iso_639_1: null,
						vote_average: 5.4,
						vote_count: 10
					}
				],
				posters: [
					{
						aspect_ratio: 0.667,
						height: 1500,
						width: 1000,
						file_path: '/fightclub_poster.jpg',
						iso_639_1: 'en',
						vote_average: 6.2,
						vote_count: 20
					}
				],
				logos: [
					{
						aspect_ratio: 2.5,
						height: 200,
						width: 500,
						file_path: '/fightclub_logo.png',
						iso_639_1: 'en',
						vote_average: 5.0,
						vote_count: 2
					}
				]
			};

			const customFetch: typeof fetch = (async (input: RequestInfo | URL) => {
				capturedUrl = typeof input === 'string' ? input : input.toString();
				return new Response(JSON.stringify(mockImages), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}) as typeof fetch;

			const result = await getMovieImages(550, {}, customFetch);

			expect(capturedUrl).toContain('/movie/550/images');
			expect(capturedUrl).toContain('include_image_language=en%2Cid%2Cnull');
			expect(result.id).toBe(550);
			expect(result.backdrops).toHaveLength(1);
			expect(result.posters).toHaveLength(1);
			expect(result.logos).toHaveLength(1);
		});

		it('supports custom include_image_language configuration', async () => {
			let capturedUrl = '';
			const customFetch: typeof fetch = (async (input: RequestInfo | URL) => {
				capturedUrl = typeof input === 'string' ? input : input.toString();
				return new Response(JSON.stringify({ id: 100, backdrops: [], posters: [], logos: [] }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}) as typeof fetch;

			await getMovieImages(100, { include_image_language: 'en,ja,null' }, customFetch);
			expect(capturedUrl).toContain('include_image_language=en%2Cja%2Cnull');
		});

		it('throws TMDBError when TMDB images endpoint fails', async () => {
			const errorFetch: typeof fetch = (async () => {
				return new Response(JSON.stringify({ status_message: 'Server Error' }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				});
			}) as typeof fetch;

			await expect(getMovieImages(999, {}, errorFetch)).rejects.toThrow();
		});
	});

	describe('normalizeTMDBImages Normalizer', () => {
		const rawImages: TMDBMovieImagesResponse = {
			id: 157336,
			backdrops: [
				{
					aspect_ratio: 1.77777777777778,
					height: 2160,
					width: 3840,
					file_path: '/interstellar_bg1.jpg',
					iso_639_1: null,
					vote_average: 8.5,
					vote_count: 42
				},
				{
					aspect_ratio: 1.778,
					height: 1080,
					width: 1920,
					file_path: '/interstellar_bg2.jpg',
					iso_639_1: 'en',
					vote_average: 7.9,
					vote_count: 15
				},
				// Duplicate path that should be deduplicated
				{
					aspect_ratio: 1.778,
					height: 1080,
					width: 1920,
					file_path: '/interstellar_bg1.jpg',
					iso_639_1: null,
					vote_average: 8.5,
					vote_count: 42
				}
			],
			posters: [
				{
					aspect_ratio: 0.666666666666667,
					height: 3000,
					width: 2000,
					file_path: '/interstellar_poster_en.jpg',
					iso_639_1: 'en',
					vote_average: 8.8,
					vote_count: 65
				},
				{
					aspect_ratio: 0.667,
					height: 1500,
					width: 1000,
					file_path: '/interstellar_poster_id.jpg',
					iso_639_1: 'id',
					vote_average: 7.5,
					vote_count: 8
				},
				{
					aspect_ratio: 0.667,
					height: 1500,
					width: 1000,
					file_path: '/interstellar_poster_neutral.jpg',
					iso_639_1: null,
					vote_average: 7.2,
					vote_count: 10
				}
			],
			logos: [
				{
					aspect_ratio: 3.125,
					height: 160,
					width: 500,
					file_path: '/interstellar_logo_en.png',
					iso_639_1: 'en',
					vote_average: 5.3,
					vote_count: 3
				}
			]
		};

		it('normalizes artwork items into typed structures with dimensions, aspect ratios, and language labels', () => {
			const gallery = normalizeTMDBImages(
				rawImages,
				'/interstellar_poster_en.jpg',
				'/interstellar_bg1.jpg'
			);

			expect(gallery.error).toBeNull();
			// 2 unique backdrops (deduped from 3)
			expect(gallery.backdrops).toHaveLength(2);
			// 3 unique posters
			expect(gallery.posters).toHaveLength(3);
			// 1 logo
			expect(gallery.logos).toHaveLength(1);
			// Total count
			expect(gallery.totalCount).toBe(6);
			expect(gallery.all).toHaveLength(6);

			// Test primary identification
			expect(gallery.backdrops[0].isPrimary).toBe(true);
			expect(gallery.backdrops[1].isPrimary).toBe(false);
			expect(gallery.posters[0].isPrimary).toBe(true);
			expect(gallery.posters[1].isPrimary).toBe(false);

			// Test language formatting
			expect(gallery.backdrops[0].languageLabel).toBe('Textless');
			expect(gallery.backdrops[1].languageLabel).toBe('English');
			expect(gallery.posters[0].languageLabel).toBe('English');
			expect(gallery.posters[1].languageLabel).toBe('Indonesian');
			expect(gallery.posters[2].languageLabel).toBe('Textless');

			// Test URLs
			expect(gallery.posters[0].thumbUrl).toBe(
				'https://image.tmdb.org/t/p/w500/interstellar_poster_en.jpg'
			);
			expect(gallery.posters[0].previewUrl).toBe(
				'https://image.tmdb.org/t/p/w780/interstellar_poster_en.jpg'
			);
			expect(gallery.posters[0].originalUrl).toBe(
				'https://image.tmdb.org/t/p/original/interstellar_poster_en.jpg'
			);

			expect(gallery.backdrops[0].thumbUrl).toBe(
				'https://image.tmdb.org/t/p/w780/interstellar_bg1.jpg'
			);
			expect(gallery.backdrops[0].previewUrl).toBe(
				'https://image.tmdb.org/t/p/w1280/interstellar_bg1.jpg'
			);
			expect(gallery.backdrops[0].originalUrl).toBe(
				'https://image.tmdb.org/t/p/original/interstellar_bg1.jpg'
			);

			expect(gallery.logos[0].thumbUrl).toBe(
				'https://image.tmdb.org/t/p/w300/interstellar_logo_en.png'
			);
			expect(gallery.logos[0].previewUrl).toBe(
				'https://image.tmdb.org/t/p/w500/interstellar_logo_en.png'
			);
			expect(gallery.logos[0].originalUrl).toBe(
				'https://image.tmdb.org/t/p/original/interstellar_logo_en.png'
			);
		});

		it('gracefully handles null, undefined, or empty collections', () => {
			const emptyGallery = normalizeTMDBImages(null);
			expect(emptyGallery.totalCount).toBe(0);
			expect(emptyGallery.posters).toEqual([]);
			expect(emptyGallery.backdrops).toEqual([]);
			expect(emptyGallery.logos).toEqual([]);
			expect(emptyGallery.all).toEqual([]);
			expect(emptyGallery.error).toBeNull();

			const partialGallery = normalizeTMDBImages({
				id: 1,
				backdrops: [],
				posters: [],
				logos: []
			});
			expect(partialGallery.totalCount).toBe(0);
			expect(partialGallery.all).toEqual([]);
		});
	});

	describe('Movie Detail Page Server Integration', () => {
		const mockDetails: TMDBMovieDetails = {
			id: 777,
			title: 'Gallery Masterpiece',
			overview: 'A movie with extensive artwork collections.',
			release_date: '2025-06-01',
			vote_average: 8.9,
			vote_count: 5000,
			poster_path: '/main_poster.jpg',
			backdrop_path: '/main_bg.jpg'
		};

		const mockImages: TMDBMovieImagesResponse = {
			id: 777,
			backdrops: [
				{
					aspect_ratio: 1.778,
					height: 1080,
					width: 1920,
					file_path: '/main_bg.jpg',
					iso_639_1: null
				},
				{
					aspect_ratio: 1.778,
					height: 1080,
					width: 1920,
					file_path: '/extra_bg.jpg',
					iso_639_1: 'en'
				}
			],
			posters: [
				{
					aspect_ratio: 0.667,
					height: 1500,
					width: 1000,
					file_path: '/main_poster.jpg',
					iso_639_1: 'en'
				},
				{
					aspect_ratio: 0.667,
					height: 1500,
					width: 1000,
					file_path: '/indonesian_poster.jpg',
					iso_639_1: 'id'
				}
			],
			logos: [
				{
					aspect_ratio: 2.0,
					height: 250,
					width: 500,
					file_path: '/movie_logo.png',
					iso_639_1: 'en'
				}
			]
		};

		it('loads movie details alongside artwork gallery collections', async () => {
			const fetchFn = mockFetch({
				'/movie/777/images': mockImages,
				'/movie/777': mockDetails
			});

			const result = await load({
				params: { id: '777' },
				fetch: fetchFn,
				setHeaders: () => {}
			} as unknown as Parameters<typeof load>[0]);

			expect(result.movie.title).toBe('Gallery Masterpiece');
			expect(result.gallery).toBeDefined();
			expect(result.gallery.totalCount).toBe(5);
			expect(result.gallery.posters).toHaveLength(2);
			expect(result.gallery.backdrops).toHaveLength(2);
			expect(result.gallery.logos).toHaveLength(1);
			expect(result.gallery.error).toBeNull();

			// Also attached to result.movie.gallery
			expect(result.movie.gallery?.totalCount).toBe(5);
		});

		it('recovers gracefully when images endpoint fails with 500 error', async () => {
			const fetchFn = mockFetch({
				'/movie/777/images': new TMDBError('Images service temporarily unavailable', 500),
				'/movie/777': mockDetails
			});

			const result = await load({
				params: { id: '777' },
				fetch: fetchFn,
				setHeaders: () => {}
			} as unknown as Parameters<typeof load>[0]);

			expect(result.movie.title).toBe('Gallery Masterpiece');
			expect(result.gallery.error).toContain('could not be retrieved');
			expect(result.gallery.totalCount).toBe(0);
			expect(result.gallery.posters).toEqual([]);
			expect(result.gallery.backdrops).toEqual([]);
			expect(result.gallery.logos).toEqual([]);
		});
	});
});
