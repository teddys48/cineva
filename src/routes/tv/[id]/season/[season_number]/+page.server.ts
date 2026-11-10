import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getTVDetails,
	getTVSeason,
	mapTMDBTVSeasonToSeasonDetail,
	getPosterUrl,
	TMDBError
} from '#lib/server/tmdb';
import type { TVSeasonDetail } from '#lib/types/tv';

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const rawSeriesId = params.id;
	const rawSeasonNumber = params.season_number;

	// Validate series ID format (positive integer)
	if (!rawSeriesId || !/^\d+$/.test(rawSeriesId)) {
		throw error(404, 'Invalid TV show ID');
	}

	const tvId = parseInt(rawSeriesId, 10);
	if (isNaN(tvId) || tvId <= 0) {
		throw error(404, 'Invalid TV show ID');
	}

	// Validate season number (non-negative integer, supports season 0 for specials)
	if (!rawSeasonNumber || !/^\d+$/.test(rawSeasonNumber)) {
		throw error(404, 'Invalid season number');
	}

	const seasonNumber = parseInt(rawSeasonNumber, 10);
	if (isNaN(seasonNumber) || seasonNumber < 0) {
		throw error(404, 'Invalid season number');
	}

	// HTTP caching: 3 minutes client, 5 minutes edge
	setHeaders({
		'cache-control': 'public, max-age=180, s-maxage=300'
	});

	try {
		// Fetch series summary and specific season details concurrently
		const [seriesResult, seasonResult] = await Promise.allSettled([
			getTVDetails(tvId, {}, fetch),
			getTVSeason(tvId, seasonNumber, fetch)
		]);

		if (seasonResult.status === 'rejected') {
			const reason = seasonResult.reason;
			if (reason instanceof TMDBError && reason.status === 404) {
				throw error(404, 'Season not found');
			}
			const status = reason instanceof TMDBError && reason.status ? reason.status : 500;
			throw error(status, 'Unable to load season details at this time');
		}

		const seriesDetails = seriesResult.status === 'fulfilled' ? seriesResult.value : null;
		const seriesName = seriesDetails?.name || 'TV Series';

		const seasonDetail: TVSeasonDetail = mapTMDBTVSeasonToSeasonDetail(
			seasonResult.value,
			String(tvId),
			seriesName
		);

		return {
			season: seasonDetail,
			series: {
				id: String(tvId),
				name: seriesName,
				posterUrl: seriesDetails?.poster_path
					? getPosterUrl(seriesDetails.poster_path, 'w500')
					: '',
				seasons: (seriesDetails?.seasons || []).map((s) => ({
					id: s.id,
					name: s.name,
					seasonNumber: s.season_number,
					episodeCount: s.episode_count
				}))
			}
		};
	} catch (err: unknown) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Unable to retrieve season information. Please try again.');
	}
};
