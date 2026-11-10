export type WatchlistMediaType = 'movie' | 'tv';

export interface WatchlistItem {
	id: string;
	title: string;
	posterUrl: string;
	mediaType: WatchlistMediaType;
	backdropUrl?: string;
	releaseYear?: number | null;
	rating?: number | null;
	genres?: string[];
	runtime?: string;
	overview?: string;
	savedAt: number; // Unix timestamp in milliseconds
}

export interface WatchlistStorageData {
	version: number;
	items: WatchlistItem[];
}

export type WatchlistSortOption =
	| 'date_added_desc'
	| 'date_added_asc'
	| 'rating_desc'
	| 'year_desc'
	| 'title_asc';

export type WatchlistContentTypeFilter = 'all' | 'movie' | 'tv';

export interface ToastMessage {
	id: string;
	message: string;
	type: 'success' | 'info' | 'error';
	movieTitle?: string;
}
