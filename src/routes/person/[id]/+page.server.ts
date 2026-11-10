import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getPersonDetails,
	getPersonMovieCredits,
	getPersonTVCredits,
	mapTMDBPersonToProfile,
	TMDBError
} from '#lib/server/tmdb';

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const rawId = params.id;

	// Validate route parameter: must be a positive integer
	if (!rawId || !/^\d+$/.test(rawId)) {
		throw error(404, 'Invalid person ID');
	}

	const personId = parseInt(rawId, 10);
	if (isNaN(personId) || personId <= 0) {
		throw error(404, 'Invalid person ID');
	}

	// Sensible edge caching: 3 minutes client, 5 minutes edge
	setHeaders({
		'cache-control': 'public, max-age=180, s-maxage=300'
	});

	// Concurrently fetch person details, movie credits, and TV credits
	const [personResult, movieCreditsResult, tvCreditsResult] = await Promise.allSettled([
		getPersonDetails(personId, fetch),
		getPersonMovieCredits(personId, fetch),
		getPersonTVCredits(personId, fetch)
	]);

	// Primary person details handling
	if (personResult.status === 'rejected') {
		const reason = personResult.reason;
		if (reason instanceof TMDBError && reason.status === 404) {
			throw error(404, 'Person not found');
		}
		const status = reason instanceof TMDBError && reason.status ? reason.status : 500;
		throw error(status, 'Unable to load person profile at this time');
	}

	const rawPerson = personResult.value;
	const movieCreditsData =
		movieCreditsResult.status === 'fulfilled' ? movieCreditsResult.value : null;
	const tvCreditsData =
		tvCreditsResult.status === 'fulfilled' ? tvCreditsResult.value : null;
	const creditsError =
		movieCreditsResult.status === 'rejected' || tvCreditsResult.status === 'rejected'
			? 'Filmography could not be retrieved at this time.'
			: null;

	const person = mapTMDBPersonToProfile(rawPerson, movieCreditsData, tvCreditsData);

	return {
		person,
		creditsError
	};
};
