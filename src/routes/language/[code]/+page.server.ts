import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	discoverMovies,
	mapTMDBMovieToMovie,
	formatLanguageName,
	VALID_SORT_OPTIONS
} from '#lib/server/tmdb';
import type { Movie } from '#lib/types/movie';
import type { TMDBSortOption } from '#lib/types/tmdb';

export const load: PageServerLoad = async ({ params, url, fetch, setHeaders }) => {
	const rawCode = (params.code || '').trim();

	// Validate ISO 639-1 code: 2 alphabetic characters
	if (!/^[a-zA-Z]{2}$/.test(rawCode)) {
		throw error(404, 'Invalid language code. Expected a 2-letter ISO 639-1 code.');
	}

	const langCode = rawCode.toLowerCase();
	const languageName = formatLanguageName(langCode) || langCode.toUpperCase();

	// Edge caching
	setHeaders({
		'cache-control': 'public, max-age=180, s-maxage=300'
	});

	// Parse page (1..500)
	const rawPage = parseInt(url.searchParams.get('page') || '1', 10);
	const currentPage = Math.max(1, Math.min(500, isNaN(rawPage) ? 1 : rawPage));

	// Parse sort option
	const rawSort = url.searchParams.get('sortBy') || 'popularity.desc';
	const validSortBy: TMDBSortOption = VALID_SORT_OPTIONS.includes(rawSort as TMDBSortOption)
		? (rawSort as TMDBSortOption)
		: 'popularity.desc';

	try {
		// Discover movies filtered by original language
		const discoverData = await discoverMovies(
			{
				with_original_language: langCode,
				page: currentPage,
				sort_by: validSortBy
			},
			fetch
		);

		const movies: Movie[] = (discoverData.results || []).map((m) => mapTMDBMovieToMovie(m));

		return {
			langCode,
			languageName,
			movies,
			totalPages: discoverData.total_pages || 0,
			totalResults: discoverData.total_results || 0,
			currentPage,
			sortBy: validSortBy,
			error: null
		};
	} catch (err: unknown) {
		console.error('Language discovery error:', err instanceof Error ? err.message : String(err));
		return {
			langCode,
			languageName,
			movies: [] as Movie[],
			totalPages: 0,
			totalResults: 0,
			currentPage,
			sortBy: validSortBy,
			error: `Unable to retrieve films with original language ${languageName} at this time. Please try again later.`
		};
	}
};
