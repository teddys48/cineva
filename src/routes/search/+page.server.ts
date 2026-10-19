import type { PageServerLoad } from './$types';
import { unifiedSearch, getMovieGenres } from '#lib/server/tmdb';
import type { Movie } from '#lib/types/movie';
import type { SearchPerson, SearchCompany, ActiveFilterItem } from '#lib/types/search';
import type { TMDBGenre } from '#lib/types/tmdb';
import { interpretQuery } from '#lib/search-query';

export const load: PageServerLoad = async ({ url, fetch, setHeaders }) => {
	const query = (url.searchParams.get('query') || url.searchParams.get('q') || '').trim();
	const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
	const page = Math.max(1, Math.min(500, isNaN(pageParam) ? 1 : pageParam));

	// Parse discovery filters
	const genre = url.searchParams.get('genre') || undefined;
	const rawYear = parseInt(url.searchParams.get('year') || '', 10);
	const year = !isNaN(rawYear) && rawYear >= 1888 ? rawYear : undefined;

	const rawRating = parseFloat(
		url.searchParams.get('minRating') || url.searchParams.get('rating') || ''
	);
	const minRating = !isNaN(rawRating) && rawRating >= 0 ? rawRating : undefined;

	const language = url.searchParams.get('language') || url.searchParams.get('lang') || undefined;
	const country = url.searchParams.get('country') || undefined;
	const company = url.searchParams.get('company') || undefined;
	const sortBy =
		url.searchParams.get('sortBy') || url.searchParams.get('sort') || 'popularity.desc';

	setHeaders({
		'cache-control': 'public, max-age=60, s-maxage=120'
	});

	const hasFilters = Boolean(genre || year || minRating || language || country || company);

	// Fetch genres
	const genres: TMDBGenre[] = await getMovieGenres(fetch).catch(() => []);

	if (!query && !hasFilters) {
		return {
			query: '',
			page: 1,
			movies: [] as Movie[],
			people: [] as SearchPerson[],
			companies: [] as SearchCompany[],
			activeFilters: [] as ActiveFilterItem[],
			interpretation: interpretQuery(''),
			totalPages: 0,
			totalResults: 0,
			genres,
			filters: {
				genre: '',
				year: null as number | null,
				minRating: null as number | null,
				language: '',
				country: '',
				company: '',
				sortBy: 'popularity.desc'
			},
			error: null
		};
	}

	try {
		const searchResult = await unifiedSearch(
			{
				query,
				genre,
				year,
				minRating,
				language,
				country,
				company,
				sortBy,
				page
			},
			fetch
		);

		return {
			query: searchResult.query,
			page: searchResult.page,
			movies: searchResult.movies,
			people: searchResult.people,
			companies: searchResult.companies,
			activeFilters: searchResult.activeFilters,
			interpretation: searchResult.interpretation,
			totalPages: searchResult.totalPages,
			totalResults: searchResult.totalResults,
			genres: searchResult.genres.length > 0 ? searchResult.genres : genres,
			filters: {
				genre: genre || '',
				year: year ?? null,
				minRating: minRating ?? null,
				language: language || '',
				country: country || '',
				company: company || '',
				sortBy
			},
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
			people: [] as SearchPerson[],
			companies: [] as SearchCompany[],
			activeFilters: [] as ActiveFilterItem[],
			interpretation: interpretQuery(query),
			totalPages: 0,
			totalResults: 0,
			genres,
			filters: {
				genre: genre || '',
				year: year ?? null,
				minRating: minRating ?? null,
				language: language || '',
				country: country || '',
				company: company || '',
				sortBy
			},
			error: 'Unable to retrieve search results from TMDB. Please try again.'
		};
	}
};
