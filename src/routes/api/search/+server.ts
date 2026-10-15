import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchMovies, mapTMDBMovieToMovie } from '#lib/server/tmdb';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const query = (url.searchParams.get('query') || url.searchParams.get('q') || '').trim();
	const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
	const page = Math.max(1, Math.min(500, isNaN(pageParam) ? 1 : pageParam));

	if (!query) {
		return json({
			results: [],
			totalPages: 0,
			totalResults: 0,
			page: 1
		});
	}

	try {
		const data = await searchMovies({ query, page }, fetch);
		const movies = (data.results || []).map((m) => mapTMDBMovieToMovie(m));

		return json(
			{
				results: movies,
				totalPages: data.total_pages || 0,
				totalResults: data.total_results || 0,
				page: data.page || page
			},
			{
				headers: {
					'cache-control': 'public, max-age=60, s-maxage=120'
				}
			}
		);
	} catch (err: unknown) {
		// Log error server-side without exposing internal error or tokens to client
		console.error('Search endpoint error:', err instanceof Error ? err.message : String(err));
		return json(
			{
				error: 'Unable to perform movie search at this time. Please try again later.',
				results: [],
				totalPages: 0,
				totalResults: 0,
				page: 1
			},
			{ status: 500 }
		);
	}
};
