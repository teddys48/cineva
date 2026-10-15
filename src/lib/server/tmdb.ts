import type {
	TMDBMovie,
	TMDBMovieDetails,
	TMDBPaginatedResponse,
	TMDBGenre,
	SearchMoviesOptions,
	DiscoverMoviesOptions,
	TMDBSortOption
} from '#lib/types/tmdb';
import type { Movie } from '#lib/types/movie';

interface PrivateEnv {
	TMDB_ACCESS_TOKEN?: string;
	TMDB_API_READ_ACCESS_TOKEN?: string;
	[key: string]: unknown;
}

// Safely load private environment from SvelteKit runtime, falling back to process.env in unit tests
const privateEnv: PrivateEnv =
	((await import('$app/env/private').catch(() => ({}))) as PrivateEnv) || {};

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const DEFAULT_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache
const GENRES_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours cache for genres

/**
 * Standard TMDB movie genre dictionary
 */
export const TMDB_GENRES: Record<number, string> = {
	28: 'Action',
	12: 'Adventure',
	16: 'Animation',
	35: 'Comedy',
	80: 'Crime',
	99: 'Documentary',
	18: 'Drama',
	10751: 'Family',
	14: 'Fantasy',
	36: 'History',
	27: 'Horror',
	10402: 'Music',
	9648: 'Mystery',
	10749: 'Romance',
	878: 'Sci-Fi',
	10770: 'TV Movie',
	53: 'Thriller',
	10752: 'War',
	37: 'Western'
};

/**
 * Valid TMDB discover sorting modes
 */
export const VALID_SORT_OPTIONS: TMDBSortOption[] = [
	'popularity.desc',
	'popularity.asc',
	'vote_average.desc',
	'vote_average.asc',
	'primary_release_date.desc',
	'primary_release_date.asc'
];

/**
 * Custom error class for TMDB client operations
 */
export class TMDBError extends Error {
	constructor(
		message: string,
		public status?: number,
		public endpoint?: string
	) {
		super(message);
		this.name = 'TMDBError';
	}
}

/**
 * In-memory TTL cache entry
 */
interface CacheEntry<T> {
	data: T;
	expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Read cached item if not expired
 */
function getCached<T>(key: string): T | null {
	const entry = memoryCache.get(key);
	if (!entry) return null;
	if (Date.now() > entry.expiresAt) {
		memoryCache.delete(key);
		return null;
	}
	return entry.data as T;
}

/**
 * Store item in cache with TTL
 */
function setCached<T>(key: string, data: T, ttlMs: number = CACHE_TTL_MS): void {
	memoryCache.set(key, {
		data,
		expiresAt: Date.now() + ttlMs
	});
}

/**
 * Clear the internal cache (useful for testing)
 */
export function clearCache(): void {
	memoryCache.clear();
}

/**
 * Safely retrieve the TMDB access token without printing or leaking secrets
 */
export function getTMDBToken(): string {
	const token =
		(typeof privateEnv.TMDB_ACCESS_TOKEN === 'string' ? privateEnv.TMDB_ACCESS_TOKEN : undefined) ||
		(typeof privateEnv.TMDB_API_READ_ACCESS_TOKEN === 'string'
			? privateEnv.TMDB_API_READ_ACCESS_TOKEN
			: undefined) ||
		(typeof process !== 'undefined'
			? process.env?.TMDB_ACCESS_TOKEN || process.env?.TMDB_API_READ_ACCESS_TOKEN
			: undefined);

	if (!token || typeof token !== 'string' || token.trim() === '') {
		throw new TMDBError(
			'TMDB access token is not configured. Set TMDB_ACCESS_TOKEN in your environment.'
		);
	}
	return token.trim();
}

/**
 * Build a valid TMDB poster image URL with fallback to empty string
 */
export function getPosterUrl(
	posterPath: string | null | undefined,
	size: 'w342' | 'w500' | 'w780' | 'original' = 'w500'
): string {
	if (!posterPath) return '';
	return `${TMDB_IMAGE_BASE_URL}/${size}${posterPath.startsWith('/') ? posterPath : `/${posterPath}`}`;
}

/**
 * Build a valid TMDB backdrop image URL with fallback to empty string
 */
export function getBackdropUrl(
	backdropPath: string | null | undefined,
	size: 'w780' | 'w1280' | 'original' = 'w1280'
): string {
	if (!backdropPath) return '';
	return `${TMDB_IMAGE_BASE_URL}/${size}${backdropPath.startsWith('/') ? backdropPath : `/${backdropPath}`}`;
}

/**
 * Format minutes runtime to readable string, e.g. 145 -> '2h 25m'
 */
export function formatRuntime(minutes: number | null | undefined): string | undefined {
	if (!minutes || minutes <= 0) return undefined;
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
	if (hours > 0) return `${hours}h`;
	return `${mins}m`;
}

/**
 * Format release date string, extracting release year and human-readable text
 */
export function parseReleaseDate(dateStr?: string | null): {
	year: number | null;
	dateText?: string;
} {
	if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
		return { year: null };
	}
	const parts = dateStr.split('-');
	const year = parseInt(parts[0], 10);
	if (isNaN(year) || year < 1888) {
		return { year: null };
	}

	let dateText: string | undefined;
	try {
		const parsed = new Date(dateStr);
		if (!isNaN(parsed.getTime())) {
			dateText = parsed.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		}
	} catch {
		dateText = undefined;
	}

	return { year, dateText };
}

/**
 * Transform a raw TMDB movie object into Cineva's Movie model
 */
export function mapTMDBMovieToMovie(
	tmdbMovie: TMDBMovie,
	options: {
		isUpcoming?: boolean;
		director?: string;
		runtime?: string;
	} = {}
): Movie {
	const { year, dateText } = parseReleaseDate(tmdbMovie.release_date);

	// Map genre names from genre_ids or genres array
	let genreNames: string[] = [];
	if (Array.isArray(tmdbMovie.genres) && tmdbMovie.genres.length > 0) {
		genreNames = tmdbMovie.genres.map((g) => g.name);
	} else if (Array.isArray(tmdbMovie.genre_ids)) {
		genreNames = tmdbMovie.genre_ids
			.map((id) => TMDB_GENRES[id])
			.filter((name): name is string => Boolean(name));
	}

	// Format rating: null if no votes or 0 rating
	const rating =
		tmdbMovie.vote_count > 0 && tmdbMovie.vote_average > 0
			? Number(tmdbMovie.vote_average.toFixed(1))
			: null;

	const runtimeStr =
		options.runtime || (tmdbMovie.runtime ? formatRuntime(tmdbMovie.runtime) : undefined);

	return {
		id: String(tmdbMovie.id),
		title: tmdbMovie.title || tmdbMovie.original_title || 'Untitled',
		tagline: tmdbMovie.tagline || undefined,
		overview: tmdbMovie.overview || 'No synopsis available for this title.',
		releaseYear: year,
		rating,
		voteCount: tmdbMovie.vote_count || 0,
		genres: genreNames,
		posterUrl: getPosterUrl(tmdbMovie.poster_path, 'w500'),
		backdropUrl: getBackdropUrl(tmdbMovie.backdrop_path, 'w1280'),
		director: options.director,
		runtime: runtimeStr,
		isUpcoming: options.isUpcoming,
		releaseDateText: dateText
	};
}

/**
 * Core TMDB API fetcher
 */
export async function tmdbFetch<T>(
	endpoint: string,
	params: Record<string, string | number | boolean | undefined> = {},
	fetchFn: typeof fetch = fetch
): Promise<T> {
	const token = getTMDBToken();

	const url = new URL(`${TMDB_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null && value !== '') {
			url.searchParams.set(key, String(value));
		}
	}

	const cacheKey = url.toString();
	const cached = getCached<T>(cacheKey);
	if (cached) {
		return cached;
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

	try {
		const response = await fetchFn(url.toString(), {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json'
			},
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			let errorMsg = `TMDB API request failed with status ${response.status}`;
			try {
				const errorJson = (await response.json()) as { status_message?: string };
				if (errorJson?.status_message) {
					errorMsg = errorJson.status_message;
				}
			} catch {
				// Ignore JSON parse errors on non-200 responses
			}
			throw new TMDBError(errorMsg, response.status, endpoint);
		}

		const data = (await response.json()) as T;
		setCached<T>(cacheKey, data);
		return data;
	} catch (err: unknown) {
		clearTimeout(timeoutId);
		if (err instanceof TMDBError) {
			throw err;
		}
		if (err instanceof Error && err.name === 'AbortError') {
			throw new TMDBError(`Request timed out after ${DEFAULT_TIMEOUT_MS}ms`, 408, endpoint);
		}
		throw new TMDBError(
			`Network error when reaching TMDB: ${err instanceof Error ? err.message : String(err)}`,
			500,
			endpoint
		);
	}
}

/**
 * Fetch weekly trending movies
 */
export async function getTrendingMovies(
	options: { page?: number; language?: string } = {},
	fetchFn: typeof fetch = fetch
): Promise<TMDBPaginatedResponse<TMDBMovie>> {
	const page = Math.max(1, Math.min(500, options.page ?? 1));
	return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>(
		'/trending/movie/week',
		{
			page,
			language: options.language ?? 'en-US'
		},
		fetchFn
	);
}

/**
 * Fetch popular movies
 */
export async function getPopularMovies(
	options: { page?: number; language?: string } = {},
	fetchFn: typeof fetch = fetch
): Promise<TMDBPaginatedResponse<TMDBMovie>> {
	const page = Math.max(1, Math.min(500, options.page ?? 1));
	return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>(
		'/movie/popular',
		{
			page,
			language: options.language ?? 'en-US'
		},
		fetchFn
	);
}

/**
 * Fetch now playing movies
 */
export async function getNowPlayingMovies(
	options: { page?: number; language?: string } = {},
	fetchFn: typeof fetch = fetch
): Promise<TMDBPaginatedResponse<TMDBMovie>> {
	const page = Math.max(1, Math.min(500, options.page ?? 1));
	return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>(
		'/movie/now_playing',
		{
			page,
			language: options.language ?? 'en-US'
		},
		fetchFn
	);
}

/**
 * Fetch upcoming movies
 */
export async function getUpcomingMovies(
	options: { page?: number; language?: string } = {},
	fetchFn: typeof fetch = fetch
): Promise<TMDBPaginatedResponse<TMDBMovie>> {
	const page = Math.max(1, Math.min(500, options.page ?? 1));
	return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>(
		'/movie/upcoming',
		{
			page,
			language: options.language ?? 'en-US'
		},
		fetchFn
	);
}

/**
 * Fetch full details for a single movie with credits
 */
export async function getMovieDetails(
	movieId: number | string,
	options: { language?: string } = {},
	fetchFn: typeof fetch = fetch
): Promise<TMDBMovieDetails> {
	return tmdbFetch<TMDBMovieDetails>(
		`/movie/${movieId}`,
		{
			language: options.language ?? 'en-US',
			append_to_response: 'credits'
		},
		fetchFn
	);
}

/**
 * Search movies by title with query validation and pagination bounds
 */
export async function searchMovies(
	options: SearchMoviesOptions,
	fetchFn: typeof fetch = fetch
): Promise<TMDBPaginatedResponse<TMDBMovie>> {
	const trimmedQuery = (options.query || '').trim();
	if (!trimmedQuery) {
		return {
			page: 1,
			results: [],
			total_pages: 0,
			total_results: 0
		};
	}

	const page = Math.max(1, Math.min(500, options.page ?? 1));

	return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>(
		'/search/movie',
		{
			query: trimmedQuery.slice(0, 150),
			page,
			language: options.language ?? 'en-US',
			include_adult: options.include_adult ?? false,
			primary_release_year: options.primary_release_year
		},
		fetchFn
	);
}

/**
 * Discover movies with multi-criteria filters and sorting
 */
export async function discoverMovies(
	options: DiscoverMoviesOptions = {},
	fetchFn: typeof fetch = fetch
): Promise<TMDBPaginatedResponse<TMDBMovie>> {
	const page = Math.max(1, Math.min(500, options.page ?? 1));

	// Normalize sort option
	let sortBy = options.sort_by || 'popularity.desc';
	if (!VALID_SORT_OPTIONS.includes(sortBy as TMDBSortOption)) {
		sortBy = 'popularity.desc';
	}

	const params: Record<string, string | number | boolean | undefined> = {
		page,
		sort_by: sortBy,
		language: options.language ?? 'en-US',
		include_adult: false
	};

	if (options.with_genres) {
		params['with_genres'] = String(options.with_genres);
	}

	if (
		options.primary_release_year &&
		options.primary_release_year >= 1888 &&
		options.primary_release_year <= new Date().getFullYear() + 5
	) {
		params['primary_release_year'] = options.primary_release_year;
	}

	if (
		typeof options.min_rating === 'number' &&
		!isNaN(options.min_rating) &&
		options.min_rating > 0
	) {
		const clampedRating = Math.min(10, Math.max(0, options.min_rating));
		params['vote_average.gte'] = clampedRating;
		// Ensure minimum votes for rated discovery so outlier 1-vote movies don't skew results
		params['vote_count.gte'] = options.vote_count_gte ?? 10;
	} else if (sortBy === 'vote_average.desc') {
		// When sorting by highest rating without explicit minRating, enforce a robust threshold of votes
		params['vote_count.gte'] = options.vote_count_gte ?? 100;
	}

	return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', params, fetchFn);
}

/**
 * Fetch movie genre dictionary from TMDB with fallback to static genres
 */
export async function getMovieGenres(fetchFn: typeof fetch = fetch): Promise<TMDBGenre[]> {
	const cacheKey = 'tmdb_genres_list_all';
	const cached = getCached<TMDBGenre[]>(cacheKey);
	if (cached) {
		return cached;
	}

	try {
		const response = await tmdbFetch<{ genres: TMDBGenre[] }>(
			'/genre/movie/list',
			{ language: 'en-US' },
			fetchFn
		);
		if (response && Array.isArray(response.genres) && response.genres.length > 0) {
			setCached<TMDBGenre[]>(cacheKey, response.genres, GENRES_CACHE_TTL_MS);
			return response.genres;
		}
	} catch {
		// Fallback gracefully to standard static TMDB genres if TMDB call fails
	}

	const fallbackGenres: TMDBGenre[] = Object.entries(TMDB_GENRES).map(([id, name]) => ({
		id: Number(id),
		name
	}));
	setCached<TMDBGenre[]>(cacheKey, fallbackGenres, CACHE_TTL_MS);
	return fallbackGenres;
}
