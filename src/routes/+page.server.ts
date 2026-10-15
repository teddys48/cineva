import type { PageServerLoad } from './$types';
import {
	getTrendingMovies,
	getPopularMovies,
	getNowPlayingMovies,
	getUpcomingMovies,
	getMovieDetails,
	mapTMDBMovieToMovie
} from '#lib/server/tmdb';
import type { Movie } from '#lib/types/movie';
import type { TMDBMovie } from '#lib/types/tmdb';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	// Enable sensible HTTP caching on the page response (3 minutes client, 5 minutes CDN/edge)
	setHeaders({
		'cache-control': 'public, max-age=180, s-maxage=300'
	});

	// Fetch all 4 independent homepage sections concurrently
	const [trendingResult, popularResult, nowPlayingResult, upcomingResult] =
		await Promise.allSettled([
			getTrendingMovies({ page: 1 }, fetch),
			getPopularMovies({ page: 1 }, fetch),
			getNowPlayingMovies({ page: 1 }, fetch),
			getUpcomingMovies({ page: 1 }, fetch)
		]);

	let trendingMovies: Movie[] = [];
	let trendingError: string | null = null;
	let rawTrending: TMDBMovie[] = [];

	if (trendingResult.status === 'fulfilled') {
		rawTrending = trendingResult.value.results || [];
		trendingMovies = rawTrending.map((m) => mapTMDBMovieToMovie(m));
	} else {
		trendingError = 'Trending releases could not be retrieved at this time.';
	}

	let popularMovies: Movie[] = [];
	let popularError: string | null = null;
	let rawPopular: TMDBMovie[] = [];

	if (popularResult.status === 'fulfilled') {
		rawPopular = popularResult.value.results || [];
		popularMovies = rawPopular.map((m) => mapTMDBMovieToMovie(m));
	} else {
		popularError = 'Popular titles could not be retrieved at this time.';
	}

	let nowPlayingMovies: Movie[] = [];
	let nowPlayingError: string | null = null;

	if (nowPlayingResult.status === 'fulfilled') {
		nowPlayingMovies = (nowPlayingResult.value.results || []).map((m) => mapTMDBMovieToMovie(m));
	} else {
		nowPlayingError = 'Now playing titles could not be retrieved at this time.';
	}

	let upcomingMovies: Movie[] = [];
	let upcomingError: string | null = null;

	if (upcomingResult.status === 'fulfilled') {
		upcomingMovies = (upcomingResult.value.results || []).map((m) =>
			mapTMDBMovieToMovie(m, { isUpcoming: true })
		);
	} else {
		upcomingError = 'Upcoming premieres could not be retrieved at this time.';
	}

	// Select a featured hero movie from trending (or popular) with valid backdrop and synopsis
	const heroCandidate =
		rawTrending.find((m) => m.backdrop_path && m.overview && m.overview.length > 20) ||
		rawPopular.find((m) => m.backdrop_path && m.overview && m.overview.length > 20) ||
		rawTrending[0] ||
		rawPopular[0] ||
		null;

	let featuredMovie: Movie | null = null;

	if (heroCandidate) {
		try {
			// Enrich hero with director, runtime, and tagline from movie details endpoint
			const details = await getMovieDetails(heroCandidate.id, {}, fetch);
			const director = details.credits?.crew?.find((c) => c.job === 'Director')?.name;

			featuredMovie = mapTMDBMovieToMovie(details, {
				director,
				runtime: details.runtime
					? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
					: undefined
			});
		} catch {
			// Fallback to basic candidate movie data if detail fetch fails
			featuredMovie = mapTMDBMovieToMovie(heroCandidate);
		}
	}

	return {
		featured: featuredMovie,
		trending: {
			movies: trendingMovies,
			error: trendingError
		},
		popular: {
			movies: popularMovies,
			error: popularError
		},
		nowPlaying: {
			movies: nowPlayingMovies,
			error: nowPlayingError
		},
		upcoming: {
			movies: upcomingMovies,
			error: upcomingError
		}
	};
};
