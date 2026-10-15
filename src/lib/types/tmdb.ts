/**
 * Raw TMDB API Response Types (TMDB v3)
 */

export interface TMDBMovie {
	id: number;
	title: string;
	original_title?: string;
	overview: string;
	poster_path: string | null;
	backdrop_path: string | null;
	release_date?: string;
	vote_average: number;
	vote_count: number;
	genre_ids?: number[];
	genres?: Array<{ id: number; name: string }>;
	popularity?: number;
	adult?: boolean;
	video?: boolean;
	original_language?: string;
	tagline?: string;
	runtime?: number | null;
}

export interface TMDBPaginatedResponse<T> {
	page: number;
	results: T[];
	total_pages: number;
	total_results: number;
	dates?: {
		maximum: string;
		minimum: string;
	};
}

export interface TMDBCrewMember {
	id: number;
	name: string;
	job: string;
	department?: string;
	profile_path?: string | null;
}

export interface TMDBCastMember {
	id: number;
	name: string;
	character: string;
	profile_path?: string | null;
	order?: number;
}

export interface TMDBMovieDetails extends TMDBMovie {
	credits?: {
		cast: TMDBCastMember[];
		crew: TMDBCrewMember[];
	};
	status?: string;
	budget?: number;
	revenue?: number;
	homepage?: string | null;
	imdb_id?: string | null;
}

/**
 * Standard TMDB Genre definition
 */
export interface TMDBGenre {
	id: number;
	name: string;
}

/**
 * Generic section response wrapper for graceful partial failure
 */
export interface SectionResult<T> {
	data: T;
	error: string | null;
}
