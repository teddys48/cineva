export interface WatchlistItem {
	id: string;
	title: string;
	posterUrl: string;
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
	'date_added_desc' | 'date_added_asc' | 'rating_desc' | 'year_desc' | 'title_asc';

export interface ToastMessage {
	id: string;
	message: string;
	type: 'success' | 'info' | 'error';
	movieTitle?: string;
}
