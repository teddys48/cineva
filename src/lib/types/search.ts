import type { Movie } from './movie';
import type { TMDBGenre, TMDBSortOption } from './tmdb';

export interface SearchPerson {
	id: string;
	name: string;
	profileUrl: string;
	knownForDepartment?: string;
	knownForTitles?: string[];
	popularity?: number;
}

export interface SearchCompany {
	id: string;
	name: string;
	logoUrl: string;
	originCountry?: string;
}

export interface ActiveFilterItem {
	key: string;
	label: string;
	value: string;
	displayValue: string;
}

export interface QueryInterpretation {
	rawQuery: string;
	isYearOnly: boolean;
	year?: number;
	yearRange?: { gte: number; lte: number };
	titleWithYear?: { title: string; year: number };
	genre?: { id: number; name: string };
	language?: { code: string; name: string };
	country?: { code: string; name: string };
	personIntent?: {
		name: string;
		role?: 'director' | 'actor' | 'any';
	};
	isMetadataDiscovery: boolean;
	discoveryFilters: {
		genreId?: number;
		genreName?: string;
		year?: number;
		languageCode?: string;
		languageName?: string;
		countryCode?: string;
		countryName?: string;
		directorName?: string;
		directorId?: number;
		actorName?: string;
		actorId?: number;
		companyId?: number;
		companyName?: string;
	};
	residualTitleQuery?: string;
}

export interface DiscoveryFilterSuggestion {
	type: 'genre' | 'year' | 'language' | 'country' | 'person' | 'company' | 'combined';
	label: string;
	description: string;
	query: string;
	url: string;
	badge?: string;
	filters: Record<string, string | number>;
}

export interface SuggestionMovieItem {
	id: string;
	title: string;
	releaseYear: number | null;
	rating: number | null;
	posterUrl: string;
}

export interface SearchSuggestionsResponse {
	movies: SuggestionMovieItem[];
	people: SearchPerson[];
	discovery: DiscoveryFilterSuggestion[];
}

export interface UnifiedSearchOptions {
	query?: string;
	genre?: string | number;
	year?: number;
	minRating?: number;
	language?: string;
	country?: string;
	company?: string | number;
	sortBy?: TMDBSortOption | string;
	page?: number;
	includeAdult?: boolean;
}

export interface UnifiedSearchResult {
	query: string;
	interpretation: QueryInterpretation;
	movies: Movie[];
	people: SearchPerson[];
	companies: SearchCompany[];
	activeFilters: ActiveFilterItem[];
	totalResults: number;
	totalPages: number;
	page: number;
	error: string | null;
	genres: TMDBGenre[];
}
