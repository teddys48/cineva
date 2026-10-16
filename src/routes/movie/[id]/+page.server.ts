import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getMovieDetails,
	getMovieCredits,
	getMovieVideos,
	getSimilarMovies,
	getMovieRecommendations,
	mapTMDBMovieDetailsToDetail,
	mapTMDBMovieToMovie,
	TMDBError
} from '#lib/server/tmdb';
import type { Movie } from '#lib/types/movie';

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const rawId = params.id;

	// Validate route ID format (positive integer)
	if (!rawId || !/^\d+$/.test(rawId)) {
		throw error(404, 'Invalid movie ID');
	}

	const movieId = parseInt(rawId, 10);
	if (isNaN(movieId) || movieId <= 0) {
		throw error(404, 'Invalid movie ID');
	}

	// Sensible HTTP edge caching: 3 minutes client, 5 minutes edge
	setHeaders({
		'cache-control': 'public, max-age=180, s-maxage=300'
	});

	// Concurrently fetch primary details and optional resources
	const [detailsResult, creditsResult, videosResult, similarResult, recommendationsResult] =
		await Promise.allSettled([
			getMovieDetails(movieId, {}, fetch),
			getMovieCredits(movieId, fetch),
			getMovieVideos(movieId, fetch),
			getSimilarMovies(movieId, { page: 1 }, fetch),
			getMovieRecommendations(movieId, { page: 1 }, fetch)
		]);

	// Primary movie details handling
	if (detailsResult.status === 'rejected') {
		const reason = detailsResult.reason;
		if (reason instanceof TMDBError && reason.status === 404) {
			throw error(404, 'Movie not found');
		}
		const status = reason instanceof TMDBError && reason.status ? reason.status : 500;
		throw error(status, 'Unable to load movie details at this time');
	}

	const rawDetails = detailsResult.value;
	const creditsData = creditsResult.status === 'fulfilled' ? creditsResult.value : null;
	const videosData =
		videosResult.status === 'fulfilled' && videosResult.value?.results
			? videosResult.value.results
			: null;

	const movieDetail = mapTMDBMovieDetailsToDetail(rawDetails, creditsData, videosData);

	// Process Similar movies
	let similarMovies: Movie[] = [];
	let similarError: string | null = null;
	if (similarResult.status === 'fulfilled') {
		const rawSimilar = similarResult.value?.results || [];
		similarMovies = rawSimilar
			.filter((m) => m && String(m.id) !== String(movieId))
			.map((m) => mapTMDBMovieToMovie(m))
			.slice(0, 8);
	} else {
		similarError = 'Similar titles could not be retrieved at this time.';
	}

	// Process Recommendations movies with deduplication against similar titles
	let recommendationsMovies: Movie[] = [];
	let recommendationsError: string | null = null;
	if (recommendationsResult.status === 'fulfilled') {
		const rawRecs = recommendationsResult.value?.results || [];
		const allRecs = rawRecs
			.filter((m) => m && String(m.id) !== String(movieId))
			.map((m) => mapTMDBMovieToMovie(m));

		const similarIdSet = new Set(similarMovies.map((m) => m.id));
		const nonDuplicateRecs = allRecs.filter((m) => !similarIdSet.has(m.id));

		recommendationsMovies = (nonDuplicateRecs.length > 0 ? nonDuplicateRecs : allRecs).slice(0, 8);
	} else {
		recommendationsError = 'Recommendations could not be retrieved at this time.';
	}

	return {
		movie: movieDetail,
		similar: {
			movies: similarMovies,
			error: similarError
		},
		recommendations: {
			movies: recommendationsMovies,
			error: recommendationsError
		}
	};
};
