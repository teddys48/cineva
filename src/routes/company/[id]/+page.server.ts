import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getCompanyDetails,
	discoverMovies,
	mapTMDBMovieToMovie,
	getLogoUrl,
	TMDBError
} from '#lib/server/tmdb';
import type { Movie } from '#lib/types/movie';

export const load: PageServerLoad = async ({ params, url, fetch, setHeaders }) => {
	const rawId = params.id;

	// Validate company ID parameter (positive integer)
	if (!rawId || !/^\d+$/.test(rawId)) {
		throw error(404, 'Invalid company ID');
	}

	const companyId = parseInt(rawId, 10);
	if (isNaN(companyId) || companyId <= 0) {
		throw error(404, 'Invalid company ID');
	}

	// Edge caching: 3 minutes client, 5 minutes edge
	setHeaders({
		'cache-control': 'public, max-age=180, s-maxage=300'
	});

	// Pagination: TMDB bounds 1..500
	const rawPage = parseInt(url.searchParams.get('page') || '1', 10);
	const currentPage = Math.max(1, Math.min(500, isNaN(rawPage) ? 1 : rawPage));

	// Concurrently fetch company details and associated movies
	const [detailsResult, moviesResult] = await Promise.allSettled([
		getCompanyDetails(companyId, fetch),
		discoverMovies(
			{
				with_companies: companyId,
				page: currentPage,
				sort_by: 'popularity.desc'
			},
			fetch
		)
	]);

	if (detailsResult.status === 'rejected') {
		const reason = detailsResult.reason;
		if (reason instanceof TMDBError && reason.status === 404) {
			throw error(404, 'Production company not found');
		}
		const status = reason instanceof TMDBError && reason.status ? reason.status : 500;
		throw error(status, 'Unable to load company details at this time');
	}

	const rawCompany = detailsResult.value;

	let movies: Movie[] = [];
	let totalPages = 0;
	let totalResults = 0;
	let moviesError: string | null = null;

	if (moviesResult.status === 'fulfilled') {
		const rawMovies = moviesResult.value?.results || [];
		movies = rawMovies.map((m) => mapTMDBMovieToMovie(m));
		totalPages = moviesResult.value.total_pages || 0;
		totalResults = moviesResult.value.total_results || 0;
	} else {
		moviesError = 'Associated titles could not be retrieved at this time.';
	}

	return {
		company: {
			id: rawCompany.id,
			name: rawCompany.name?.trim() || 'Unknown Company',
			description: rawCompany.description?.trim() || undefined,
			headquarters: rawCompany.headquarters?.trim() || undefined,
			homepage: rawCompany.homepage?.trim() || undefined,
			originCountry: rawCompany.origin_country?.trim() || undefined,
			logoUrl: getLogoUrl(rawCompany.logo_path, 'w300')
		},
		movies,
		totalPages,
		totalResults,
		currentPage,
		moviesError
	};
};
