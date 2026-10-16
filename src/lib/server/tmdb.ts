import type {
	TMDBMovie,
	TMDBMovieDetails,
	TMDBPaginatedResponse,
	TMDBGenre,
	SearchMoviesOptions,
	DiscoverMoviesOptions,
	TMDBSortOption,
	TMDBCreditsResponse,
	TMDBVideosResponse,
	TMDBVideo,
	TMDBPerson,
	TMDBPersonMovieCredits,
	TMDBMovieImagesResponse,
	TMDBImageItem
} from '#lib/types/tmdb';
import type {
	Movie,
	MovieDetail,
	MovieCastMember,
	MovieCrewMember,
	MovieVideo,
	KeyCrewPerson,
	MovieImage,
	MovieImageType,
	MovieImagesGallery
} from '#lib/types/movie';
import { getLogoUrl, getTMDBImageUrl } from '#lib/images';

export { getLogoUrl, getTMDBImageUrl };
import type { PersonProfile, PersonCreditMovie } from '#lib/types/person';

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
 * Build a valid TMDB profile image URL with fallback to empty string
 */
export function getProfileUrl(
	profilePath: string | null | undefined,
	size: 'w185' | 'h632' | 'original' = 'w185'
): string {
	if (!profilePath) return '';
	return `${TMDB_IMAGE_BASE_URL}/${size}${profilePath.startsWith('/') ? profilePath : `/${profilePath}`}`;
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
 * Format currency amount to USD string, e.g. 165000000 -> '$165,000,000'
 */
export function formatCurrency(amount: number | null | undefined): string | undefined {
	if (!amount || amount <= 0 || isNaN(amount)) return undefined;
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	}).format(amount);
}

/**
 * Format language code (e.g. 'en') to display name (e.g. 'English')
 */
export function formatLanguageName(langCode?: string | null): string | undefined {
	if (!langCode || typeof langCode !== 'string' || langCode.trim() === '') return undefined;
	const code = langCode.trim().toLowerCase();
	try {
		const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
		const name = displayNames.of(code);
		return name || code.toUpperCase();
	} catch {
		return code.toUpperCase();
	}
}

/**
 * Select the best official trailer or video from TMDB video results
 */
export function selectBestTrailer(videos: TMDBVideo[] | null | undefined): MovieVideo | null {
	if (!videos || !Array.isArray(videos) || videos.length === 0) return null;

	const youtubeVideos = videos.filter(
		(v) => v && v.key && typeof v.key === 'string' && v.site?.toLowerCase() === 'youtube'
	);
	if (youtubeVideos.length === 0) return null;

	// 1. Official Trailer
	const officialTrailer = youtubeVideos.find((v) => v.type === 'Trailer' && v.official === true);
	if (officialTrailer) {
		return {
			id: officialTrailer.id,
			key: officialTrailer.key,
			name: officialTrailer.name,
			site: officialTrailer.site,
			type: officialTrailer.type,
			official: true,
			publishedAt: officialTrailer.published_at
		};
	}

	// 2. Any Trailer
	const anyTrailer = youtubeVideos.find((v) => v.type === 'Trailer');
	if (anyTrailer) {
		return {
			id: anyTrailer.id,
			key: anyTrailer.key,
			name: anyTrailer.name,
			site: anyTrailer.site,
			type: anyTrailer.type,
			official: anyTrailer.official ?? false,
			publishedAt: anyTrailer.published_at
		};
	}

	// 3. Official Teaser
	const officialTeaser = youtubeVideos.find((v) => v.type === 'Teaser' && v.official === true);
	if (officialTeaser) {
		return {
			id: officialTeaser.id,
			key: officialTeaser.key,
			name: officialTeaser.name,
			site: officialTeaser.site,
			type: officialTeaser.type,
			official: true,
			publishedAt: officialTeaser.published_at
		};
	}

	// 4. Any Teaser or Clip
	const anyTeaser = youtubeVideos.find((v) => v.type === 'Teaser' || v.type === 'Clip');
	if (anyTeaser) {
		return {
			id: anyTeaser.id,
			key: anyTeaser.key,
			name: anyTeaser.name,
			site: anyTeaser.site,
			type: anyTeaser.type,
			official: anyTeaser.official ?? false,
			publishedAt: anyTeaser.published_at
		};
	}

	// 5. Fallback to first YouTube video
	const first = youtubeVideos[0];
	return {
		id: first.id,
		key: first.key,
		name: first.name,
		site: first.site,
		type: first.type,
		official: first.official ?? false,
		publishedAt: first.published_at
	};
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
 * Transform a raw TMDB movie object into Scenora's Movie model
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
		typeof tmdbMovie.vote_average === 'number' &&
		!Number.isNaN(tmdbMovie.vote_average) &&
		tmdbMovie.vote_count > 0 &&
		tmdbMovie.vote_average > 0
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
 * Transform raw TMDB details, credits, and videos into Scenora's MovieDetail model
 */
export function mapTMDBMovieDetailsToDetail(
	details: TMDBMovieDetails,
	credits?: TMDBCreditsResponse | null,
	videos?: TMDBVideo[] | null
): MovieDetail {
	const baseMovie = mapTMDBMovieToMovie(details);
	const castData = credits?.cast || details.credits?.cast || [];
	const crewData = credits?.crew || details.credits?.crew || [];

	// Curate cast: sort by order, dedup by ID, take up to 30
	const seenCastIds = new Set<number>();
	const cast: MovieCastMember[] = [];
	for (const member of castData) {
		if (!member.id || seenCastIds.has(member.id)) continue;
		seenCastIds.add(member.id);
		cast.push({
			id: member.id,
			name: member.name || 'Unknown',
			character: member.character || 'Cast',
			profileUrl: getProfileUrl(member.profile_path, 'w185'),
			order: member.order ?? 999
		});
		if (cast.length >= 30) break;
	}

	// Curate crew: extract key roles
	const directors: string[] = [];
	const directorsList: KeyCrewPerson[] = [];
	const seenDirectorIds = new Set<number>();
	const screenplay: string[] = [];
	const producers: string[] = [];
	const cinematography: string[] = [];
	const crew: MovieCrewMember[] = [];

	for (const member of crewData) {
		if (!member.name) continue;
		const name = member.name.trim();
		const job = member.job?.trim();

		if (job === 'Director') {
			if (!directors.includes(name)) {
				directors.push(name);
			}
			if (member.id && !seenDirectorIds.has(member.id)) {
				seenDirectorIds.add(member.id);
				directorsList.push({
					id: member.id,
					name,
					profileUrl: getProfileUrl(member.profile_path, 'w185')
				});
			}
		} else if (
			['Screenplay', 'Writer', 'Story', 'Author'].includes(job) &&
			!screenplay.includes(name)
		) {
			screenplay.push(name);
		} else if (['Producer', 'Executive Producer'].includes(job) && !producers.includes(name)) {
			producers.push(name);
		} else if (
			['Director of Photography', 'Cinematography'].includes(job) &&
			!cinematography.includes(name)
		) {
			cinematography.push(name);
		}

		if (crew.length < 20) {
			crew.push({
				id: member.id,
				name,
				job: member.job || 'Crew',
				department: member.department || 'Production',
				profileUrl: getProfileUrl(member.profile_path, 'w185')
			});
		}
	}

	const rawVideos = videos || [];
	const mappedVideos: MovieVideo[] = rawVideos
		.filter((v) => v && v.key && v.site?.toLowerCase() === 'youtube')
		.map((v) => ({
			id: v.id,
			key: v.key,
			name: v.name,
			site: v.site,
			type: v.type,
			official: Boolean(v.official),
			publishedAt: v.published_at
		}));

	const trailer = selectBestTrailer(rawVideos);

	// Original title if different from primary title
	const originalTitle =
		details.original_title && details.original_title !== details.title
			? details.original_title
			: undefined;

	return {
		...baseMovie,
		director: directors[0] || baseMovie.director,
		originalTitle,
		originalLanguage: formatLanguageName(details.original_language),
		status: details.status || undefined,
		budget: details.budget && details.budget > 0 ? details.budget : undefined,
		budgetText: formatCurrency(details.budget),
		revenue: details.revenue && details.revenue > 0 ? details.revenue : undefined,
		revenueText: formatCurrency(details.revenue),
		homepage: details.homepage || undefined,
		imdbId: details.imdb_id || undefined,
		productionCompanies:
			details.production_companies
				?.map((c) => c.name?.trim())
				.filter((n): n is string => Boolean(n)) || [],
		productionCountries:
			details.production_countries
				?.map((c) => c.name?.trim())
				.filter((n): n is string => Boolean(n)) || [],
		cast,
		crew,
		keyCrew: {
			directors,
			screenplay,
			producers,
			cinematography,
			directorsList
		},
		trailer,
		videos: mappedVideos
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
 * Fetch full details for a single movie with optional appended resources
 */
export async function getMovieDetails(
	movieId: number | string,
	options: { language?: string; append_to_response?: string } = {},
	fetchFn: typeof fetch = fetch
): Promise<TMDBMovieDetails> {
	return tmdbFetch<TMDBMovieDetails>(
		`/movie/${movieId}`,
		{
			language: options.language ?? 'en-US',
			append_to_response: options.append_to_response
		},
		fetchFn
	);
}

/**
 * Fetch credits (cast & crew) for a movie
 */
export async function getMovieCredits(
	movieId: number | string,
	fetchFn: typeof fetch = fetch
): Promise<TMDBCreditsResponse> {
	return tmdbFetch<TMDBCreditsResponse>(
		`/movie/${movieId}/credits`,
		{ language: 'en-US' },
		fetchFn
	);
}

/**
 * Fetch videos (trailers, teasers) for a movie
 */
export async function getMovieVideos(
	movieId: number | string,
	fetchFn: typeof fetch = fetch
): Promise<TMDBVideosResponse> {
	return tmdbFetch<TMDBVideosResponse>(`/movie/${movieId}/videos`, { language: 'en-US' }, fetchFn);
}

/**
 * Fetch image collections (posters, backdrops, logos) for a movie from TMDB
 */
export async function getMovieImages(
	movieId: number | string,
	options: { include_image_language?: string } = {},
	fetchFn: typeof fetch = fetch
): Promise<TMDBMovieImagesResponse> {
	return tmdbFetch<TMDBMovieImagesResponse>(
		`/movie/${movieId}/images`,
		{
			include_image_language: options.include_image_language ?? 'en,id,null'
		},
		fetchFn
	);
}

/**
 * Fetch similar movies
 */
export async function getSimilarMovies(
	movieId: number | string,
	options: { page?: number; language?: string } = {},
	fetchFn: typeof fetch = fetch
): Promise<TMDBPaginatedResponse<TMDBMovie>> {
	const page = Math.max(1, Math.min(500, options.page ?? 1));
	return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>(
		`/movie/${movieId}/similar`,
		{
			page,
			language: options.language ?? 'en-US'
		},
		fetchFn
	);
}

/**
 * Fetch recommended movies
 */
export async function getMovieRecommendations(
	movieId: number | string,
	options: { page?: number; language?: string } = {},
	fetchFn: typeof fetch = fetch
): Promise<TMDBPaginatedResponse<TMDBMovie>> {
	const page = Math.max(1, Math.min(500, options.page ?? 1));
	return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>(
		`/movie/${movieId}/recommendations`,
		{
			page,
			language: options.language ?? 'en-US'
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

/**
 * Fetch person profile details by TMDB ID
 */
export async function getPersonDetails(
	personId: number | string,
	fetchFn: typeof fetch = fetch
): Promise<TMDBPerson> {
	return tmdbFetch<TMDBPerson>(`/person/${personId}`, { language: 'en-US' }, fetchFn);
}

/**
 * Fetch combined movie credits (cast & crew) for a person
 */
export async function getPersonMovieCredits(
	personId: number | string,
	fetchFn: typeof fetch = fetch
): Promise<TMDBPersonMovieCredits> {
	return tmdbFetch<TMDBPersonMovieCredits>(
		`/person/${personId}/movie_credits`,
		{ language: 'en-US' },
		fetchFn
	);
}

/**
 * Calculate age based on birthday and optional deathday
 */
export function calculateAge(
	birthdayStr?: string | null,
	deathdayStr?: string | null
): number | null {
	if (!birthdayStr || typeof birthdayStr !== 'string' || birthdayStr.trim() === '') return null;
	const birth = new Date(birthdayStr);
	if (isNaN(birth.getTime())) return null;

	const end = deathdayStr ? new Date(deathdayStr) : new Date();
	if (isNaN(end.getTime())) return null;

	let age = end.getFullYear() - birth.getFullYear();
	const m = end.getMonth() - birth.getMonth();
	if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) {
		age--;
	}
	return age >= 0 && age < 130 ? age : null;
}

/**
 * Format a person date (birthday or deathday) into human-readable string
 */
export function formatPersonDate(dateStr?: string | null): string | undefined {
	if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') return undefined;
	try {
		const parsed = new Date(dateStr);
		if (!isNaN(parsed.getTime())) {
			return parsed.toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			});
		}
	} catch {
		// Fallback
	}
	return undefined;
}

/**
 * Transform raw TMDB person and movie credits into Scenora's PersonProfile model
 */
export function mapTMDBPersonToProfile(
	rawPerson: TMDBPerson,
	credits?: TMDBPersonMovieCredits | null
): PersonProfile {
	const id = String(rawPerson.id);
	const name = rawPerson.name?.trim() || 'Unknown';
	const biography = rawPerson.biography?.trim() || '';
	const profileUrl = getProfileUrl(rawPerson.profile_path, 'h632');
	const knownForDepartment = rawPerson.known_for_department?.trim() || undefined;
	const placeOfBirth = rawPerson.place_of_birth?.trim() || undefined;
	const imdbId = rawPerson.imdb_id?.trim() || undefined;
	const homepage = rawPerson.homepage?.trim() || undefined;

	const birthday = rawPerson.birthday || null;
	const deathday = rawPerson.deathday || null;
	const birthdayFormatted = formatPersonDate(birthday);
	const deathdayFormatted = formatPersonDate(deathday);
	const age = calculateAge(birthday, deathday);

	// Process Acting credits (strictly from credits.cast)
	const rawCast = credits?.cast || [];
	const actingCreditsMap = new Map<number, PersonCreditMovie>();

	for (const item of rawCast) {
		if (!item || !item.id) continue;
		const movieId = item.id;
		const charName = item.character?.trim();

		if (actingCreditsMap.has(movieId)) {
			// Combine character names if duplicate
			const existing = actingCreditsMap.get(movieId)!;
			if (charName && existing.character && !existing.character.includes(charName)) {
				existing.character = `${existing.character} / ${charName}`;
			}
			continue;
		}

		const { year, dateText } = parseReleaseDate(item.release_date);
		let genreNames: string[] = [];
		if (Array.isArray(item.genre_ids)) {
			genreNames = item.genre_ids
				.map((gId) => TMDB_GENRES[gId])
				.filter((gName): gName is string => Boolean(gName));
		}

		const rating =
			typeof item.vote_average === 'number' &&
			!Number.isNaN(item.vote_average) &&
			(item.vote_count ?? 0) > 0 &&
			item.vote_average > 0
				? Number(item.vote_average.toFixed(1))
				: null;

		actingCreditsMap.set(movieId, {
			id: String(item.id),
			title: item.title || item.original_title || 'Untitled',
			overview: item.overview || '',
			releaseYear: year,
			rating,
			voteCount: item.vote_count || 0,
			genres: genreNames,
			posterUrl: getPosterUrl(item.poster_path, 'w500'),
			backdropUrl: getBackdropUrl(item.backdrop_path, 'w1280'),
			character: charName || undefined,
			releaseDateText: dateText,
			rawReleaseDate: item.release_date || ''
		});
	}

	// Process Directing credits (strictly from credits.crew where job === 'Director')
	const rawCrew = credits?.crew || [];
	const directingCreditsMap = new Map<number, PersonCreditMovie>();

	for (const item of rawCrew) {
		if (!item || !item.id || item.job !== 'Director') continue;
		const movieId = item.id;

		if (directingCreditsMap.has(movieId)) {
			continue;
		}

		const { year, dateText } = parseReleaseDate(item.release_date);
		let genreNames: string[] = [];
		if (Array.isArray(item.genre_ids)) {
			genreNames = item.genre_ids
				.map((gId) => TMDB_GENRES[gId])
				.filter((gName): gName is string => Boolean(gName));
		}

		const rating =
			typeof item.vote_average === 'number' &&
			!Number.isNaN(item.vote_average) &&
			(item.vote_count ?? 0) > 0 &&
			item.vote_average > 0
				? Number(item.vote_average.toFixed(1))
				: null;

		directingCreditsMap.set(movieId, {
			id: String(item.id),
			title: item.title || item.original_title || 'Untitled',
			overview: item.overview || '',
			releaseYear: year,
			rating,
			voteCount: item.vote_count || 0,
			genres: genreNames,
			posterUrl: getPosterUrl(item.poster_path, 'w500'),
			backdropUrl: getBackdropUrl(item.backdrop_path, 'w1280'),
			job: 'Director',
			releaseDateText: dateText,
			rawReleaseDate: item.release_date || ''
		});
	}

	// Sort credits: release date descending, with undated entries at the end
	const sortCreditsDesc = (a: PersonCreditMovie, b: PersonCreditMovie): number => {
		const dateA = a.rawReleaseDate || '';
		const dateB = b.rawReleaseDate || '';
		if (dateA && dateB) {
			if (dateA !== dateB) {
				return dateB.localeCompare(dateA);
			}
		} else if (dateA) {
			return -1; // dated before undated
		} else if (dateB) {
			return 1;
		}
		return a.title.localeCompare(b.title);
	};

	const actingCredits = Array.from(actingCreditsMap.values()).sort(sortCreditsDesc);
	const directingCredits = Array.from(directingCreditsMap.values()).sort(sortCreditsDesc);

	const uniqueMovieIds = new Set([
		...Array.from(actingCreditsMap.keys()),
		...Array.from(directingCreditsMap.keys())
	]);

	return {
		id,
		name,
		biography,
		profileUrl,
		knownForDepartment,
		birthday,
		birthdayFormatted,
		deathday,
		deathdayFormatted,
		age,
		placeOfBirth,
		imdbId,
		homepage,
		actingCredits,
		directingCredits,
		totalCreditsCount: uniqueMovieIds.size
	};
}

/**
 * Normalize raw TMDB image collections into a clean, typed MovieImagesGallery
 */
export function normalizeTMDBImages(
	rawImages?: TMDBMovieImagesResponse | null,
	primaryPosterPath?: string | null,
	primaryBackdropPath?: string | null
): MovieImagesGallery {
	if (!rawImages) {
		return {
			posters: [],
			backdrops: [],
			logos: [],
			all: [],
			totalCount: 0,
			error: null
		};
	}

	const formatLanguage = (iso: string | null | undefined): string => {
		if (!iso || iso.trim() === '') return 'Textless';
		const lower = iso.trim().toLowerCase();
		if (lower === 'null' || lower === 'xx') return 'Textless';
		const formatted = formatLanguageName(lower);
		return formatted || lower.toUpperCase();
	};

	const cleanPrimaryPoster = primaryPosterPath
		? primaryPosterPath.startsWith('/')
			? primaryPosterPath
			: `/${primaryPosterPath}`
		: null;

	const cleanPrimaryBackdrop = primaryBackdropPath
		? primaryBackdropPath.startsWith('/')
			? primaryBackdropPath
			: `/${primaryBackdropPath}`
		: null;

	const mapItem = (item: TMDBImageItem, type: MovieImageType, index: number): MovieImage => {
		const filePath = item.file_path || '';
		const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
		let thumbUrl: string;
		let previewUrl: string;
		const originalUrl = getTMDBImageUrl(normalizedPath, 'original');

		if (type === 'poster') {
			thumbUrl = getPosterUrl(normalizedPath, 'w500');
			previewUrl = getPosterUrl(normalizedPath, 'w780');
		} else if (type === 'backdrop') {
			thumbUrl = getBackdropUrl(normalizedPath, 'w780');
			previewUrl = getBackdropUrl(normalizedPath, 'w1280');
		} else {
			thumbUrl = getLogoUrl(normalizedPath, 'w300');
			previewUrl = getLogoUrl(normalizedPath, 'w500');
		}

		const isPrimary =
			type === 'poster'
				? cleanPrimaryPoster !== null && normalizedPath === cleanPrimaryPoster
				: type === 'backdrop'
					? cleanPrimaryBackdrop !== null && normalizedPath === cleanPrimaryBackdrop
					: false;

		return {
			id: `${type}-${index}-${normalizedPath.replace(/[^a-zA-Z0-9]/g, '')}`,
			filePath: normalizedPath,
			type,
			aspectRatio:
				typeof item.aspect_ratio === 'number' && item.aspect_ratio > 0
					? Number(item.aspect_ratio.toFixed(3))
					: type === 'poster'
						? 0.667
						: type === 'backdrop'
							? 1.778
							: 1.0,
			width: item.width || 0,
			height: item.height || 0,
			iso_639_1: item.iso_639_1 || null,
			languageLabel: formatLanguage(item.iso_639_1),
			voteAverage:
				typeof item.vote_average === 'number' && !Number.isNaN(item.vote_average)
					? Number(item.vote_average.toFixed(1))
					: undefined,
			voteCount: item.vote_count ?? 0,
			thumbUrl,
			previewUrl,
			originalUrl,
			isPrimary
		};
	};

	const dedupeCategory = (
		items: TMDBImageItem[] | undefined,
		type: MovieImageType
	): MovieImage[] => {
		if (!Array.isArray(items)) return [];
		const seen = new Set<string>();
		const result: MovieImage[] = [];
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (!item || !item.file_path) continue;
			const normalizedPath = item.file_path.startsWith('/') ? item.file_path : `/${item.file_path}`;
			if (seen.has(normalizedPath)) continue;
			seen.add(normalizedPath);
			result.push(mapItem(item, type, i));
		}
		return result;
	};

	const backdrops = dedupeCategory(rawImages.backdrops, 'backdrop');
	const posters = dedupeCategory(rawImages.posters, 'poster');
	const logos = dedupeCategory(rawImages.logos, 'logo');

	const all = [...backdrops, ...posters, ...logos];
	const totalCount = backdrops.length + posters.length + logos.length;

	return {
		posters,
		backdrops,
		logos,
		all,
		totalCount,
		error: null
	};
}
