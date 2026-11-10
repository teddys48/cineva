import type { PageServerLoad } from './$types';
import {
	discoverMovies,
	discoverTV,
	getMovieGenres,
	getTVGenres,
	mapTMDBMovieToMovie,
	mapTMDBTVToTVShow,
	formatCountryName,
	formatLanguageName,
	VALID_SORT_OPTIONS,
	VALID_TV_SORT_OPTIONS,
	resolveTVGenre
} from '#lib/server/tmdb';
import type { Movie } from '#lib/types/movie';
import type { TVShow } from '#lib/types/tv';
import type { TMDBGenre, TMDBSortOption } from '#lib/types/tmdb';

export const load: PageServerLoad = async ({ url, fetch, setHeaders }) => {
	setHeaders({
		'cache-control': 'public, max-age=180, s-maxage=300'
	});

	// Content type: 'movie' | 'tv' (default 'movie')
	const rawType = (url.searchParams.get('type') || url.searchParams.get('contentType') || 'movie').toLowerCase();
	const contentType: 'movie' | 'tv' = rawType === 'tv' ? 'tv' : 'movie';

	// Fetch both movie and TV genres concurrently
	const [movieGenres, tvGenres]: [TMDBGenre[], TMDBGenre[]] = await Promise.all([
		getMovieGenres(fetch).catch(() => []),
		getTVGenres(fetch).catch(() => [])
	]);

	const genres = contentType === 'tv' ? tvGenres : movieGenres;

	// 1. Parse and sanitize genre parameter
	const rawGenre = (url.searchParams.get('genre') || '').trim();
	let selectedGenreId: number | null = null;
	let selectedGenreName: string = '';

	if (rawGenre) {
		const parsedId = parseInt(rawGenre, 10);
		if (!isNaN(parsedId)) {
			if (contentType === 'tv') {
				const resolvedTVId = resolveTVGenre(parsedId);
				selectedGenreId = resolvedTVId || parsedId;
				const found = tvGenres.find((g) => g.id === selectedGenreId);
				selectedGenreName = found ? found.name : '';
			} else {
				const found = movieGenres.find((g) => g.id === parsedId);
				if (found) {
					selectedGenreId = found.id;
					selectedGenreName = found.name;
				} else {
					selectedGenreId = parsedId;
				}
			}
		} else {
			const found = genres.find((g) => g.name.toLowerCase() === rawGenre.toLowerCase());
			if (found) {
				selectedGenreId = found.id;
				selectedGenreName = found.name;
			}
		}
	}

	// 2. Parse and sanitize release / first air year
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

	// 4. Parse and sanitize language
	const rawLanguage = (url.searchParams.get('language') || url.searchParams.get('lang') || '')
		.trim()
		.toLowerCase();
	const validLanguage = /^[a-z]{2}$/.test(rawLanguage) ? rawLanguage : undefined;
	const languageName = validLanguage ? formatLanguageName(validLanguage) : undefined;

	// 5. Parse and sanitize country
	const rawCountry = (url.searchParams.get('country') || '').trim().toUpperCase();
	const validCountry = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : undefined;
	const countryName = validCountry ? formatCountryName(validCountry) : undefined;

	// 6. Parse and sanitize company
	const rawCompany = (url.searchParams.get('company') || '').trim();
	const validCompany = /^\d+$/.test(rawCompany) ? parseInt(rawCompany, 10) : undefined;

	// 7. Parse and sanitize sort_by
	const rawSort = url.searchParams.get('sortBy') || url.searchParams.get('sort') || '';
	const validSortList = contentType === 'tv' ? VALID_TV_SORT_OPTIONS : VALID_SORT_OPTIONS;
	const validSortBy = validSortList.includes(rawSort as TMDBSortOption)
		? (rawSort as TMDBSortOption)
		: 'popularity.desc';

	// 8. Parse and sanitize page (TMDB bounds: 1 to 500)
	const rawPage = parseInt(url.searchParams.get('page') || '1', 10);
	const validPage = Math.max(1, Math.min(500, isNaN(rawPage) ? 1 : rawPage));

	try {
		if (contentType === 'tv') {
			const discoverData = await discoverTV(
				{
					page: validPage,
					with_genres: selectedGenreId ?? undefined,
					first_air_date_year: validYear ?? undefined,
					min_rating: validMinRating ?? undefined,
					with_original_language: validLanguage,
					with_origin_country: validCountry,
					with_companies: validCompany,
					sort_by: validSortBy
				},
				fetch
			);

			const tvShows: TVShow[] = (discoverData.results || []).map((show) => mapTMDBTVToTVShow(show));

			return {
				contentType: 'tv' as const,
				movies: [] as Movie[],
				tvShows,
				genres,
				movieGenres,
				tvGenres,
				totalPages: discoverData.total_pages || 0,
				totalResults: discoverData.total_results || 0,
				filters: {
					contentType: 'tv' as const,
					genre: selectedGenreId ? String(selectedGenreId) : '',
					genreName: selectedGenreName,
					year: validYear,
					minRating: validMinRating,
					language: validLanguage || '',
					languageName: languageName || '',
					country: validCountry || '',
					countryName: countryName || '',
					company: validCompany ? String(validCompany) : '',
					sortBy: validSortBy,
					page: validPage
				},
				error: null
			};
		} else {
			const discoverData = await discoverMovies(
				{
					page: validPage,
					with_genres: selectedGenreId ?? undefined,
					primary_release_year: validYear ?? undefined,
					min_rating: validMinRating ?? undefined,
					with_original_language: validLanguage,
					with_origin_country: validCountry,
					with_companies: validCompany,
					sort_by: validSortBy
				},
				fetch
			);

			const movies: Movie[] = (discoverData.results || []).map((m) => mapTMDBMovieToMovie(m));

			return {
				contentType: 'movie' as const,
				movies,
				tvShows: [] as TVShow[],
				genres,
				movieGenres,
				tvGenres,
				totalPages: discoverData.total_pages || 0,
				totalResults: discoverData.total_results || 0,
				filters: {
					contentType: 'movie' as const,
					genre: selectedGenreId ? String(selectedGenreId) : '',
					genreName: selectedGenreName,
					year: validYear,
					minRating: validMinRating,
					language: validLanguage || '',
					languageName: languageName || '',
					country: validCountry || '',
					countryName: countryName || '',
					company: validCompany ? String(validCompany) : '',
					sortBy: validSortBy,
					page: validPage
				},
				error: null
			};
		}
	} catch (err: unknown) {
		console.error('Explore server load error:', err instanceof Error ? err.message : String(err));
		return {
			contentType,
			movies: [] as Movie[],
			tvShows: [] as TVShow[],
			genres,
			movieGenres,
			tvGenres,
			totalPages: 0,
			totalResults: 0,
			filters: {
				contentType,
				genre: selectedGenreId ? String(selectedGenreId) : '',
				genreName: selectedGenreName,
				year: validYear,
				minRating: validMinRating,
				language: validLanguage || '',
				languageName: languageName || '',
				country: validCountry || '',
				countryName: countryName || '',
				company: validCompany ? String(validCompany) : '',
				sortBy: validSortBy,
				page: validPage
			},
			error: 'Unable to retrieve discovery content from TMDB. Please try again.'
		};
	}
};
