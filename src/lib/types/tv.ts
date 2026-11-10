import type {
	MovieGenreInfo,
	MovieCastMember,
	MovieCrewMember,
	KeyCrewPerson,
	ProductionCompanyInfo,
	ProductionCountryInfo,
	SpokenLanguageInfo,
	MovieVideo,
	MovieImagesGallery
} from './movie';

export interface TVShow {
	id: string;
	title: string; // Series name (title alias for consistency)
	name: string; // Official TMDB series name
	originalName?: string;
	tagline?: string;
	overview: string;
	firstAirYear?: number | null;
	lastAirYear?: number | null;
	firstAirDate?: string;
	lastAirDate?: string;
	rating?: number | null; // 0.0 - 10.0
	voteCount?: number;
	genres: string[];
	posterUrl: string;
	backdropUrl: string;
	originCountry?: string[];
	originalLanguage?: string;
	originalLanguageName?: string;
	numberOfSeasons?: number;
	numberOfEpisodes?: number;
	status?: string;
	mediaType: 'tv';
}

export interface TVSeasonSummary {
	id: number;
	name: string;
	seasonNumber: number;
	overview?: string;
	posterUrl: string;
	airDate: string | null;
	airYear?: number | null;
	episodeCount: number;
}

export interface TVEpisode {
	id: number;
	name: string;
	overview: string;
	episodeNumber: number;
	seasonNumber: number;
	airDate: string | null;
	airDateFormatted?: string;
	runtime?: string;
	runtimeMinutes?: number | null;
	stillUrl: string;
	rating?: number | null;
	voteCount?: number;
	guestStars?: MovieCastMember[];
	crew?: MovieCrewMember[];
}

export interface TVSeasonDetail {
	id: number;
	name: string;
	seasonNumber: number;
	overview: string;
	posterUrl: string;
	airDate: string | null;
	airYear?: number | null;
	episodes: TVEpisode[];
	seriesId: string;
	seriesName?: string;
}

export interface TVNetworkInfo {
	id: number;
	name: string;
	logoUrl?: string;
	originCountry?: string;
}

export interface TVCreatorInfo {
	id: number;
	name: string;
	profileUrl?: string;
}

export interface TVDetail extends TVShow {
	tagline?: string;
	contentRating?: string;
	episodeRuntime?: string;
	homepage?: string;
	networks: TVNetworkInfo[];
	productionCompanies: string[];
	productionCompaniesList: ProductionCompanyInfo[];
	productionCountries: string[];
	productionCountriesList: ProductionCountryInfo[];
	spokenLanguagesList: SpokenLanguageInfo[];
	genresList: MovieGenreInfo[];
	creators: TVCreatorInfo[];
	cast: MovieCastMember[];
	crew: MovieCrewMember[];
	keyCrew: {
		directors: string[];
		directorsList: KeyCrewPerson[];
		writers: string[];
		writersList: KeyCrewPerson[];
		producers: string[];
		producersList: KeyCrewPerson[];
		cinematographyList: KeyCrewPerson[];
		composersList: KeyCrewPerson[];
		editorsList: KeyCrewPerson[];
	};
	seasons: TVSeasonSummary[];
	trailer?: MovieVideo | null;
	gallery?: MovieImagesGallery;
}
