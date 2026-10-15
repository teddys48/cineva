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
