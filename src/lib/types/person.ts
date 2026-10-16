import type { Movie } from './movie';

export interface PersonCreditMovie extends Movie {
	character?: string;
	job?: string;
	department?: string;
	rawReleaseDate?: string;
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
	actingCredits: PersonCreditMovie[];
	directingCredits: PersonCreditMovie[];
	writingCredits: PersonCreditMovie[];
	producingCredits: PersonCreditMovie[];
	cinematographyCredits: PersonCreditMovie[];
	otherCrewCredits: PersonCreditMovie[];
	totalCreditsCount: number;
}
