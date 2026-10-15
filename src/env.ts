import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	TMDB_ACCESS_TOKEN: {
		schema: (value) => value
	},
	TMDB_API_READ_ACCESS_TOKEN: {
		schema: (value) => value
	}
});
