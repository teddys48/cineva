import type { PageServerLoad } from './$types';
import {
	discoverMovies,
	getMovieGenres,
	mapTMDBMovieToMovie,
	VALID_SORT_OPTIONS
} from '#lib/server/tmdb';
import type { Movie } from '#lib/types/movie';
import type { TMDBGenre, TMDBSortOption } from '#lib/types/tmdb';

export const load: PageServerLoad = async ({ url, fetch, setHeaders }) => {
	setHeaders({
		'cache-control': 'public, max-age=180, s-maxage=300'
	});

	// Fetch genres first with graceful fallback
	const genres: TMDBGenre[] = await getMovieGenres(fetch).catch(() => []);

	// 1. Parse and sanitize genre parameter (supports ID or slug/name)
	const rawGenre = (url.searchParams.get('genre') || '').trim();
	let selectedGenreId: number | null = null;
	let selectedGenreName: string = '';

	if (rawGenre) {
		const parsedId = parseInt(rawGenre, 10);
		if (!isNaN(parsedId)) {
			const found = genres.find((g) => g.id === parsedId);
			if (found) {
				selectedGenreId = found.id;
				selectedGenreName = found.name;
			} else {
				selectedGenreId = parsedId;
			}
		} else {
			const found = genres.find((g) => g.name.toLowerCase() === rawGenre.toLowerCase());
			if (found) {
				selectedGenreId = found.id;
				selectedGenreName = found.name;
			}
		}
	}

	// 2. Parse and sanitize release year
	const rawYear = parseInt(url.searchParams.get('year') || '', 10);
	const currentYear = new Date().getFullYear();
	const validYear =
		!isNaN(rawYear) && rawYear >= 1888 && rawYear <= currentYear + 5 ? rawYear : null;

	// 3. Parse and sanitize minimum rating
	const rawRating = parseFloat(
		url.searchParams.get('minRating') || url.searchParams.get('rating') || ''
	);
	const validMinRating =
		!isNaN(rawRating) && rawRating >= 0 && rawRating <= 10 ? Math.round(rawRating * 10) / 10 : null;

	// 4. Parse and sanitize sort_by
	const rawSort = url.searchParams.get('sortBy') || url.searchParams.get('sort') || '';
	const validSortBy: TMDBSortOption = VALID_SORT_OPTIONS.includes(rawSort as TMDBSortOption)
		? (rawSort as TMDBSortOption)
		: 'popularity.desc';

	// 5. Parse and sanitize page (TMDB bounds: 1 to 500)
	const rawPage = parseInt(url.searchParams.get('page') || '1', 10);
	const validPage = Math.max(1, Math.min(500, isNaN(rawPage) ? 1 : rawPage));

	// Fetch discovered movies
	try {
		const discoverData = await discoverMovies(
			{
				page: validPage,
				with_genres: selectedGenreId ?? undefined,
				primary_release_year: validYear ?? undefined,
				min_rating: validMinRating ?? undefined,
				sort_by: validSortBy
			},
			fetch
		);

		const movies: Movie[] = (discoverData.results || []).map((m) => mapTMDBMovieToMovie(m));

		return {
			movies,
			genres,
			totalPages: discoverData.total_pages || 0,
			totalResults: discoverData.total_results || 0,
			filters: {
				genre: selectedGenreId ? String(selectedGenreId) : '',
				genreName: selectedGenreName,
				year: validYear,
				minRating: validMinRating,
				sortBy: validSortBy,
				page: validPage
			},
			error: null
		};
	} catch (err: unknown) {
		console.error('Explore server load error:', err instanceof Error ? err.message : String(err));
		return {
			movies: [] as Movie[],
			genres,
			totalPages: 0,
			totalResults: 0,
			filters: {
				genre: selectedGenreId ? String(selectedGenreId) : '',
				genreName: selectedGenreName,
				year: validYear,
				minRating: validMinRating,
				sortBy: validSortBy,
				page: validPage
			},
			error: 'Unable to retrieve movies for the selected criteria. Please try again.'
		};
	}
};
