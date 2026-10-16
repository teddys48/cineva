export interface Movie {
	id: string;
	title: string;
	tagline?: string;
	overview: string;
	releaseYear?: number | null;
	rating?: number | null; // 0.0 - 10.0
	voteCount?: number;
	genres: string[];
	posterUrl: string;
	backdropUrl: string;
	director?: string;
	runtime?: string;
	contentRating?: string;
	isUpcoming?: boolean;
	releaseDateText?: string;
	featured?: boolean;
}

export interface Genre {
	id: number;
	name: string;
	slug: string;
	description: string;
	movieCount: number;
}

export interface MovieGenreInfo {
	id: number;
	name: string;
}

export interface MovieCastMember {
	id: number;
	name: string;
	character: string;
	profileUrl: string;
	order: number;
}

export interface MovieCrewMember {
	id: number;
	name: string;
	job: string;
	department: string;
	profileUrl: string;
}

export interface KeyCrewPerson {
	id: number;
	name: string;
	job?: string;
	department?: string;
	profileUrl?: string;
}

export interface ProductionCompanyInfo {
	id: number;
	name: string;
	logoPath?: string | null;
	logoUrl?: string;
	originCountry?: string;
}

export interface ProductionCountryInfo {
	iso_3166_1: string;
	name: string;
}

export interface SpokenLanguageInfo {
	iso_639_1: string;
	name: string;
	englishName?: string;
}

export interface MovieVideo {
	id: string;
	key: string;
	name: string;
	site: string;
	type: string;
	official: boolean;
	publishedAt?: string;
}

export type MovieImageType = 'poster' | 'backdrop' | 'logo';

export interface MovieImage {
	id: string;
	filePath: string;
	type: MovieImageType;
	aspectRatio: number;
	width: number;
	height: number;
	iso_639_1: string | null;
	languageLabel: string;
	voteAverage?: number;
	voteCount?: number;
	thumbUrl: string;
	previewUrl: string;
	originalUrl: string;
	isPrimary?: boolean;
}

export interface MovieGalleryCategory {
	id: 'all' | 'posters' | 'backdrops' | 'logos';
	label: string;
	count: number;
}

export interface MovieImagesGallery {
	posters: MovieImage[];
	backdrops: MovieImage[];
	logos: MovieImage[];
	all: MovieImage[];
	totalCount: number;
	error: string | null;
}

export interface MovieDetail extends Movie {
	originalTitle?: string;
	originalLanguage?: string;
	originalLanguageCode?: string;
	status?: string;
	budget?: number;
	budgetText?: string;
	revenue?: number;
	revenueText?: string;
	homepage?: string;
	imdbId?: string;
	productionCompanies: string[];
	productionCompaniesList?: ProductionCompanyInfo[];
	productionCountries: string[];
	productionCountriesList?: ProductionCountryInfo[];
	spokenLanguagesList?: SpokenLanguageInfo[];
	genresList?: MovieGenreInfo[];
	cast: MovieCastMember[];
	crew: MovieCrewMember[];
	keyCrew: {
		directors: string[];
		screenplay: string[];
		producers: string[];
		cinematography: string[];
		directorsList?: KeyCrewPerson[];
		screenplayList?: KeyCrewPerson[];
		producersList?: KeyCrewPerson[];
		cinematographyList?: KeyCrewPerson[];
		composersList?: KeyCrewPerson[];
		editorsList?: KeyCrewPerson[];
		productionDesignList?: KeyCrewPerson[];
		artDirectionList?: KeyCrewPerson[];
		costumeDesignList?: KeyCrewPerson[];
	};
	trailer?: MovieVideo | null;
	videos: MovieVideo[];
	gallery?: MovieImagesGallery;
}
