import type { PageServerLoad } from './$types';
import { searchMovies, mapTMDBMovieToMovie } from '#lib/server/tmdb';
import type { Movie } from '#lib/types/movie';

export const load: PageServerLoad = async ({ url, fetch, setHeaders }) => {
	const query = (url.searchParams.get('query') || url.searchParams.get('q') || '').trim();
	const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
	const page = Math.max(1, Math.min(500, isNaN(pageParam) ? 1 : pageParam));

	setHeaders({
		'cache-control': 'public, max-age=60, s-maxage=120'
	});

	if (!query) {
		return {
			query: '',
			page: 1,
			movies: [] as Movie[],
			totalPages: 0,
			totalResults: 0,
			error: null
		};
	}

	try {
		const searchData = await searchMovies({ query, page }, fetch);
		const movies = (searchData.results || []).map((m) => mapTMDBMovieToMovie(m));

		return {
			query,
			page,
			movies,
			totalPages: searchData.total_pages || 0,
			totalResults: searchData.total_results || 0,
			error: null
		};
	} catch (err: unknown) {
		console.error(
			'Search page server load error:',
			err instanceof Error ? err.message : String(err)
		);
		return {
			query,
			page,
			movies: [] as Movie[],
			totalPages: 0,
			totalResults: 0,
			error: 'Unable to retrieve search results from TMDB. Please try again.'
		};
	}
};
