import { describe, it, expect, beforeEach } from 'bun:test';
import { GET as getSitemap } from '../src/routes/sitemap.xml/+server';
import { GET as getSearchApi } from '../src/routes/api/search/+server';
import {
	getTMDBToken,
	TMDBError,
	clearCache,
	TMDB_GENRES,
	getPosterUrl,
	getBackdropUrl,
	getProfileUrl,
	getLogoUrl
} from '../src/lib/server/tmdb';

describe('Phase 6: Quality, SEO, Accessibility, Security & Deployment Verification', () => {
	beforeEach(() => {
		clearCache();
	});

	describe('Security & Environment Isolation', () => {
		it('ensures TMDB token retrieval does not leak token string into standard error messages', () => {
			const originalToken = process.env.TMDB_ACCESS_TOKEN;
			try {
				delete process.env.TMDB_ACCESS_TOKEN;
				delete process.env.TMDB_API_READ_ACCESS_TOKEN;

				expect(() => getTMDBToken()).toThrow(TMDBError);
				expect(() => getTMDBToken()).toThrow(
					'TMDB access token is not configured. Set TMDB_ACCESS_TOKEN in your environment.'
				);
			} finally {
				if (originalToken) {
					process.env.TMDB_ACCESS_TOKEN = originalToken;
				}
			}
		});

		it('ensures VITE_ prefixed tokens do not exist in the environment', () => {
			expect(process.env.VITE_TMDB_ACCESS_TOKEN).toBeUndefined();
			expect(process.env.VITE_TMDB_TOKEN).toBeUndefined();
		});

		it('validates image helpers sanitize paths and reject null/undefined without leaking URLs', () => {
			expect(getPosterUrl(null)).toBe('');
			expect(getPosterUrl(undefined)).toBe('');
			expect(getBackdropUrl(null)).toBe('');
			expect(getBackdropUrl(undefined)).toBe('');
			expect(getProfileUrl(null)).toBe('');
			expect(getProfileUrl(undefined)).toBe('');
			expect(getLogoUrl(null)).toBe('');
			expect(getLogoUrl(undefined)).toBe('');
		});
	});

	describe('Dynamic Sitemap XML Generation', () => {
		it('generates valid XML sitemap with correct namespaces and content type', async () => {
			const mockUrl = new URL('https://scenora.example.com/sitemap.xml');
			const response = await getSitemap({
				url: mockUrl,
				params: {},
				route: { id: '/sitemap.xml' }
			} as unknown as Parameters<typeof getSitemap>[0]);

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toContain('application/xml');
			expect(response.headers.get('Cache-Control')).toContain('public');

			const xmlText = await response.text();
			expect(xmlText.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
			expect(xmlText).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
			expect(xmlText).toContain('<loc>https://scenora.example.com</loc>');
			expect(xmlText).toContain('<loc>https://scenora.example.com/explore</loc>');

			// Contains TMDB genre canonical discovery paths
			expect(xmlText).toContain('<loc>https://scenora.example.com/explore?genre=28</loc>'); // Action
			expect(xmlText).toContain('<loc>https://scenora.example.com/explore?genre=878</loc>'); // Sci-Fi
			expect(xmlText).toContain('</urlset>');
		});

		it('dynamically adapts loc tags to request origin without hardcoding any domain', async () => {
			const testOrigins = ['http://localhost:5173', 'https://custom-cinema-domain.org'];

			for (const origin of testOrigins) {
				const mockUrl = new URL(`${origin}/sitemap.xml`);
				const response = await getSitemap({
					url: mockUrl,
					params: {},
					route: { id: '/sitemap.xml' }
				} as unknown as Parameters<typeof getSitemap>[0]);

				const xmlText = await response.text();
				expect(xmlText).toContain(`<loc>${origin}</loc>`);
				expect(xmlText).toContain(`<loc>${origin}/explore</loc>`);
			}
		});
	});

	describe('Search Endpoint Error Handling and API Boundaries', () => {
		it('returns empty result array when search query is empty string', async () => {
			const mockUrl = new URL('https://scenora.example.com/api/search?query=');
			const response = await getSearchApi({
				url: mockUrl,
				fetch: globalThis.fetch
			} as unknown as Parameters<typeof getSearchApi>[0]);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data.results).toEqual([]);
			expect(data.totalResults).toBe(0);
		});

		it('handles search server errors without leaking raw exception details', async () => {
			const mockUrl = new URL('https://scenora.example.com/api/search?query=ErrorTrigger');
			const failingFetch: typeof fetch = async () => {
				return new Response(JSON.stringify({ status_message: 'Invalid API key or token' }), {
					status: 401
				});
			};

			const response = await getSearchApi({
				url: mockUrl,
				fetch: failingFetch
			} as unknown as Parameters<typeof getSearchApi>[0]);

			expect(response.status).toBe(500);
			const data = await response.json();
			expect(data.error).toBe(
				'Unable to perform movie search at this time. Please try again later.'
			);
			expect(data.results).toEqual([]);
		});
	});

	describe('Data Formatters and Attribution Integrity', () => {
		it('verifies all TMDB genres are properly registered', () => {
			expect(Object.keys(TMDB_GENRES).length).toBeGreaterThan(15);
			expect(TMDB_GENRES[28]).toBe('Action');
			expect(TMDB_GENRES[35]).toBe('Comedy');
			expect(TMDB_GENRES[18]).toBe('Drama');
		});
	});
});
