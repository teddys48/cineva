import type { Movie } from './movie';

export interface PersonCreditMovie extends Movie {
	character?: string;
	job?: string;
	department?: string;
	rawReleaseDate?: string;
	mediaType?: 'movie';
}

export interface PersonCreditTV {
	id: string;
	title: string; // Series name
	name: string; // Official series name
	overview: string;
	posterUrl: string;
	backdropUrl?: string;
	releaseYear?: number | null;
	rating?: number | null;
	genres: string[];
	character?: string;
	job?: string;
	department?: string;
	rawFirstAirDate?: string;
	episodeCount?: number;
	mediaType: 'tv';
}

export type PersonCreditItem = PersonCreditMovie | PersonCreditTV;

export interface RoleCreditsGroup<T = PersonCreditMovie> {
	acting: T[];
	directing: T[];
	writing: T[];
	producing: T[];
	cinematography: T[];
	other: T[];
	totalCount: number;
}

export interface PersonProfile {
	id: string;
	name: string;
	biography: string;
	profileUrl: string;
	knownForDepartment?: string;
	birthday?: string | null;
	birthdayFormatted?: string;
	deathday?: string | null;
	deathdayFormatted?: string;
	age?: number | null;
	placeOfBirth?: string;
	imdbId?: string;
	homepage?: string;

	// Backward-compatible movie credits
	actingCredits: PersonCreditMovie[];
	directingCredits: PersonCreditMovie[];
	writingCredits: PersonCreditMovie[];
	producingCredits: PersonCreditMovie[];
	cinematographyCredits: PersonCreditMovie[];
	otherCrewCredits: PersonCreditMovie[];

	// Structured filmography separated by content type
	movieCredits?: RoleCreditsGroup<PersonCreditMovie>;
	tvCredits?: RoleCreditsGroup<PersonCreditTV>;
	movieCreditsCount?: number;
	tvCreditsCount?: number;

	totalCreditsCount: number;
}
