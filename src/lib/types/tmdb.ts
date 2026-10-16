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

export interface TMDBCreditsResponse {
	id: number;
	cast: TMDBCastMember[];
	crew: TMDBCrewMember[];
}

export interface TMDBVideo {
	id: string;
	iso_639_1?: string;
	iso_3166_1?: string;
	key: string;
	name: string;
	site: string;
	size?: number;
	type: string;
	official: boolean;
	published_at?: string;
}

export interface TMDBVideosResponse {
	id: number;
	results: TMDBVideo[];
}

export interface TMDBProductionCompany {
	id: number;
	name: string;
	logo_path?: string | null;
	origin_country?: string;
}

export interface TMDBCompanyDetails {
	id: number;
	name: string;
	description?: string;
	headquarters?: string;
	homepage?: string;
	logo_path?: string | null;
	origin_country?: string;
	parent_company?: { id: number; name: string; logo_path?: string | null } | null;
}

export interface TMDBProductionCountry {
	iso_3166_1: string;
	name: string;
}

export interface TMDBSpokenLanguage {
	english_name?: string;
	iso_639_1: string;
	name: string;
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
	production_companies?: TMDBProductionCompany[];
	production_countries?: TMDBProductionCountry[];
	spoken_languages?: TMDBSpokenLanguage[];
}

/**
 * TMDB Raw Image Assets (/movie/{id}/images)
 */
export interface TMDBImageItem {
	aspect_ratio: number;
	height: number;
	iso_639_1: string | null;
	file_path: string;
	vote_average?: number;
	vote_count?: number;
	width: number;
}

export interface TMDBMovieImagesResponse {
	id: number;
	backdrops: TMDBImageItem[];
	posters: TMDBImageItem[];
	logos: TMDBImageItem[];
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

/**
 * Curated supported TMDB sort options for Explore
 */
export type TMDBSortOption =
	| 'popularity.desc'
	| 'popularity.asc'
	| 'vote_average.desc'
	| 'vote_average.asc'
	| 'primary_release_date.desc'
	| 'primary_release_date.asc';

export interface SearchMoviesOptions {
	query: string;
	page?: number;
	language?: string;
	include_adult?: boolean;
	primary_release_year?: number;
}

export interface DiscoverMoviesOptions {
	page?: number;
	with_genres?: string | number;
	with_companies?: string | number;
	with_origin_country?: string;
	with_original_language?: string;
	primary_release_year?: number;
	min_rating?: number;
	sort_by?: TMDBSortOption | string;
	language?: string;
	vote_count_gte?: number;
}

export interface ExploreFilters {
	genre?: string;
	year?: number;
	minRating?: number;
	sortBy?: string;
	page?: number;
}

/**
 * TMDB Person and Filmography response types
 */
export interface TMDBPerson {
	id: number;
	name: string;
	biography?: string;
	birthday?: string | null;
	deathday?: string | null;
	place_of_birth?: string | null;
	profile_path?: string | null;
	known_for_department?: string;
	also_known_as?: string[];
	gender?: number;
	popularity?: number;
	homepage?: string | null;
	imdb_id?: string | null;
}

export interface TMDBPersonCastCredit {
	id: number;
	title?: string;
	original_title?: string;
	character?: string;
	poster_path?: string | null;
	backdrop_path?: string | null;
	release_date?: string;
	vote_average?: number;
	vote_count?: number;
	overview?: string;
	genre_ids?: number[];
	popularity?: number;
	adult?: boolean;
	order?: number;
}

export interface TMDBPersonCrewCredit {
	id: number;
	title?: string;
	original_title?: string;
	job: string;
	department?: string;
	poster_path?: string | null;
	backdrop_path?: string | null;
	release_date?: string;
	vote_average?: number;
	vote_count?: number;
	overview?: string;
	genre_ids?: number[];
	popularity?: number;
	adult?: boolean;
}

export interface TMDBPersonMovieCredits {
	id: number;
	cast: TMDBPersonCastCredit[];
	crew: TMDBPersonCrewCredit[];
}
