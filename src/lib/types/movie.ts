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

export interface MovieVideo {
	id: string;
	key: string;
	name: string;
	site: string;
	type: string;
	official: boolean;
	publishedAt?: string;
}

export interface MovieDetail extends Movie {
	originalTitle?: string;
	originalLanguage?: string;
	status?: string;
	budget?: number;
	budgetText?: string;
	revenue?: number;
	revenueText?: string;
	homepage?: string;
	imdbId?: string;
	productionCompanies: string[];
	productionCountries: string[];
	cast: MovieCastMember[];
	crew: MovieCrewMember[];
	keyCrew: {
		directors: string[];
		screenplay: string[];
		producers: string[];
		cinematography: string[];
	};
	trailer?: MovieVideo | null;
	videos: MovieVideo[];
}
