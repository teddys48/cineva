import type { RequestHandler } from './$types';
import { TMDB_GENRES } from '#lib/server/tmdb';

export const GET: RequestHandler = async ({ url }) => {
	// Dynamically use request origin (or optional environment variable), avoiding any hardcoded domains
	const siteOrigin = url.origin;

	// Core canonical public pages
	const staticRoutes = [
		{ path: '', changefreq: 'daily', priority: '1.0' },
		{ path: '/explore', changefreq: 'daily', priority: '0.9' }
	];

	// Canonical genre collection discovery routes
	const genreRoutes = Object.entries(TMDB_GENRES).map(([id]) => ({
		path: `/explore?genre=${id}`,
		changefreq: 'weekly',
		priority: '0.8'
	}));

	const routes = [...staticRoutes, ...genreRoutes];

	const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
	.map(
		(r) => `  <url>
    <loc>${siteOrigin}${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`.trim();

	return new Response(sitemapXml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=86400',
			'X-Content-Type-Options': 'nosniff'
		}
	});
};
