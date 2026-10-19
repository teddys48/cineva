import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	unifiedSearch,
	searchMovies,
	searchPeople,
	mapTMDBMovieToMovie,
	mapTMDBPersonSearchResult
} from '#lib/server/tmdb';
import { generateDiscoverySuggestions, interpretQuery } from '#lib/search-query';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const query = (url.searchParams.get('query') || url.searchParams.get('q') || '').trim();
	const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
	const page = Math.max(1, Math.min(500, isNaN(pageParam) ? 1 : pageParam));

	const isSuggest =
		url.searchParams.get('suggest') === 'true' || url.searchParams.get('type') === 'suggest';

	// Parse optional discovery filter parameters
	const genre = url.searchParams.get('genre') || undefined;
	const yearParam = parseInt(url.searchParams.get('year') || '', 10);
	const year = !isNaN(yearParam) && yearParam >= 1888 ? yearParam : undefined;

	const ratingParam = parseFloat(
		url.searchParams.get('minRating') || url.searchParams.get('rating') || ''
	);
	const minRating = !isNaN(ratingParam) && ratingParam >= 0 ? ratingParam : undefined;

	const language = url.searchParams.get('language') || url.searchParams.get('lang') || undefined;
	const country = url.searchParams.get('country') || undefined;
	const company = url.searchParams.get('company') || undefined;
	const sortBy = url.searchParams.get('sortBy') || url.searchParams.get('sort') || undefined;

	// Suggest mode: lightweight categorized typeahead suggestions
	if (isSuggest) {
		if (!query || query.length < 2) {
			return json({
				query: '',
				movies: [],
				people: [],
				discovery: []
			});
		}

		try {
			const [movieRes, personRes] = await Promise.allSettled([
				searchMovies({ query, page: 1 }, fetch),
				searchPeople({ query, page: 1 }, fetch)
			]);

			const movies =
				movieRes.status === 'fulfilled'
					? (movieRes.value.results || []).slice(0, 5).map((m) => {
							const movie = mapTMDBMovieToMovie(m);
							return {
								id: movie.id,
								title: movie.title,
								releaseYear: movie.releaseYear,
								rating: movie.rating,
								posterUrl: movie.posterUrl
							};
						})
					: [];

			const people =
				personRes.status === 'fulfilled'
					? (personRes.value.results || []).slice(0, 3).map(mapTMDBPersonSearchResult)
					: [];

			const discovery = generateDiscoverySuggestions(query);

			return json(
				{
					query,
					movies,
					people,
					discovery
				},
				{
					headers: {
						'cache-control': 'public, max-age=60, s-maxage=120'
					}
				}
			);
		} catch (err: unknown) {
			console.error(
				'Suggestions endpoint error:',
				err instanceof Error ? err.message : String(err)
			);
			return json({
				query,
				movies: [],
				people: [],
				discovery: generateDiscoverySuggestions(query)
			});
		}
	}

	// Empty query and no filters
	const hasFilters = Boolean(genre || year || minRating || language || country || company);
	if (!query && !hasFilters) {
		return json({
			results: [],
			movies: [],
			people: [],
			companies: [],
			activeFilters: [],
			interpretation: interpretQuery(''),
			totalPages: 0,
			totalResults: 0,
			page: 1
		});
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

		return json(
			{
				// Backward-compatible 'results' field mapped to movies for existing API consumers
				results: searchResult.movies,
				movies: searchResult.movies,
				people: searchResult.people,
				companies: searchResult.companies,
				activeFilters: searchResult.activeFilters,
				interpretation: searchResult.interpretation,
				totalPages: searchResult.totalPages,
				totalResults: searchResult.totalResults,
				page: searchResult.page
			},
			{
				headers: {
					'cache-control': 'public, max-age=60, s-maxage=120'
				}
			}
		);
	} catch (err: unknown) {
		console.error('Search endpoint error:', err instanceof Error ? err.message : String(err));
		return json(
			{
				error: 'Unable to perform movie search at this time. Please try again later.',
				results: [],
				movies: [],
				people: [],
				companies: [],
				activeFilters: [],
				totalPages: 0,
				totalResults: 0,
				page: 1
			},
			{ status: 500 }
		);
	}
};
