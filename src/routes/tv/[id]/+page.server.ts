import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getTVDetails,
	getTVCredits,
	getTVVideos,
	getSimilarTV,
	getTVRecommendations,
	getTVImages,
	getTVContentRatings,
	normalizeTMDBImages,
	mapTMDBTVDetailsToDetail,
	mapTMDBTVToTVShow,
	TMDBError
} from '#lib/server/tmdb';
import type { TVShow, TVDetail } from '#lib/types/tv';
import type { MovieImagesGallery } from '#lib/types/movie';

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const rawId = params.id;

	// Validate route ID format (positive integer)
	if (!rawId || !/^\d+$/.test(rawId)) {
		throw error(404, 'Invalid TV show ID');
	}

	const tvId = parseInt(rawId, 10);
	if (isNaN(tvId) || tvId <= 0) {
		throw error(404, 'Invalid TV show ID');
	}

	// HTTP caching: 3 minutes client, 5 minutes edge
	setHeaders({
		'cache-control': 'public, max-age=180, s-maxage=300'
	});

	// Concurrently fetch primary series details and optional companion data
	const [
		detailsResult,
		creditsResult,
		videosResult,
		similarResult,
		recommendationsResult,
		imagesResult,
		contentRatingsResult
	] = await Promise.allSettled([
		getTVDetails(tvId, {}, fetch),
		getTVCredits(tvId, fetch),
		getTVVideos(tvId, fetch),
		getSimilarTV(tvId, { page: 1 }, fetch),
		getTVRecommendations(tvId, { page: 1 }, fetch),
		getTVImages(tvId, {}, fetch),
		getTVContentRatings(tvId, fetch)
	]);

	// Primary TV details handling
	if (detailsResult.status === 'rejected') {
		const reason = detailsResult.reason;
		if (reason instanceof TMDBError && reason.status === 404) {
			throw error(404, 'TV show not found');
		}
		const status = reason instanceof TMDBError && reason.status ? reason.status : 500;
		throw error(status, 'Unable to load TV show details at this time');
	}

	const rawDetails = detailsResult.value;
	const creditsData = creditsResult.status === 'fulfilled' ? creditsResult.value : null;
	const videosData = videosResult.status === 'fulfilled' ? videosResult.value : null;
	const contentRatingsData =
		contentRatingsResult.status === 'fulfilled' ? contentRatingsResult.value : null;

	// Process Artwork Gallery
	let gallery: MovieImagesGallery;
	if (imagesResult.status === 'fulfilled' && imagesResult.value) {
		gallery = normalizeTMDBImages(
			imagesResult.value,
			rawDetails.poster_path,
			rawDetails.backdrop_path
		);
	} else {
		gallery = {
			posters: [],
			backdrops: [],
			logos: [],
			all: [],
			totalCount: 0,
			error: 'TV artwork could not be retrieved at this time.'
		};
	}

	const tvDetail: TVDetail = mapTMDBTVDetailsToDetail(
		rawDetails,
		creditsData,
		videosData?.results,
		contentRatingsData
	);
	tvDetail.gallery = gallery;

	// Process Similar TV shows
	let similarShows: TVShow[] = [];
	let similarError: string | null = null;
	if (similarResult.status === 'fulfilled') {
		const rawSimilar = similarResult.value?.results || [];
		similarShows = rawSimilar
			.filter((s) => s && String(s.id) !== String(tvId))
			.map((s) => mapTMDBTVToTVShow(s))
			.slice(0, 8);
	} else {
		similarError = 'Similar TV series could not be retrieved at this time.';
	}

	// Process Recommendations TV shows with deduplication against similar titles
	let recommendationsShows: TVShow[] = [];
	let recommendationsError: string | null = null;
	if (recommendationsResult.status === 'fulfilled') {
		const rawRecs = recommendationsResult.value?.results || [];
		const allRecs = rawRecs
			.filter((s) => s && String(s.id) !== String(tvId))
			.map((s) => mapTMDBTVToTVShow(s));

		const similarIdSet = new Set(similarShows.map((s) => s.id));
		const nonDuplicateRecs = allRecs.filter((s) => !similarIdSet.has(s.id));

		recommendationsShows = (nonDuplicateRecs.length > 0 ? nonDuplicateRecs : allRecs).slice(0, 8);
	} else {
		recommendationsError = 'Recommendations could not be retrieved at this time.';
	}

	return {
		tvShow: tvDetail,
		gallery,
		similar: {
			items: similarShows,
			error: similarError
		},
		recommendations: {
			items: recommendationsShows,
			error: recommendationsError
		}
	};
};
