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
	TMDBCompanyDetails,
	TMDBPerson,
	TMDBPersonMovieCredits,
	TMDBPersonCrewCredit,
	TMDBMovieImagesResponse,
	TMDBImageItem,
	TMDBPersonSearchResult,
	TMDBCompanySearchResult
} from '#lib/types/tmdb';
import type {
	SearchPerson,
	SearchCompany,
	UnifiedSearchOptions,
	UnifiedSearchResult
} from '#lib/types/search';
import {
	interpretQuery,
	GENRE_MAP,
	resolveGenre,
	resolveLanguage,
	resolveCountry,
	buildActiveFilterItems
} from '#lib/search-query';
import type {
	Movie,
	MovieDetail,
	MovieCastMember,
	MovieCrewMember,
	MovieVideo,
	KeyCrewPerson,
	ProductionCompanyInfo,
	ProductionCountryInfo,
	SpokenLanguageInfo,
	MovieGenreInfo,
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
 * Format country ISO 3166-1 code to human-readable English name
 */
export function formatCountryName(countryCode?: string | null): string | undefined {
	if (!countryCode || typeof countryCode !== 'string' || countryCode.trim() === '')
		return undefined;
	const code = countryCode.trim().toUpperCase();
	try {
		const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
		const name = displayNames.of(code);
		return name || code;
	} catch {
		return code;
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
 * Transform raw TMDB details, credits, and videos into Cineva's MovieDetail model
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

	// Curate crew: extract key roles with IDs and names
	const directors: string[] = [];
	const directorsList: KeyCrewPerson[] = [];
	const seenDirectorIds = new Set<number>();

	const screenplay: string[] = [];
	const screenplayList: KeyCrewPerson[] = [];
	const seenScreenplayIds = new Set<number>();

	const producers: string[] = [];
	const producersList: KeyCrewPerson[] = [];
	const seenProducerIds = new Set<number>();

	const cinematography: string[] = [];
	const cinematographyList: KeyCrewPerson[] = [];
	const seenCinematographyIds = new Set<number>();

	const composersList: KeyCrewPerson[] = [];
	const seenComposerIds = new Set<number>();

	const editorsList: KeyCrewPerson[] = [];
	const seenEditorIds = new Set<number>();

	const productionDesignList: KeyCrewPerson[] = [];
	const seenProdDesignIds = new Set<number>();

	const artDirectionList: KeyCrewPerson[] = [];
	const seenArtDirectionIds = new Set<number>();

	const costumeDesignList: KeyCrewPerson[] = [];
	const seenCostumeDesignIds = new Set<number>();

	const crew: MovieCrewMember[] = [];
	const seenCrewKeys = new Set<string>();

	for (const member of crewData) {
		if (!member.name || !member.id) continue;
		const name = member.name.trim();
		const job = member.job?.trim() || 'Crew';
		const dept = member.department?.trim() || 'Production';
		const profileUrl = getProfileUrl(member.profile_path, 'w185');

		if (job === 'Director') {
			if (!directors.includes(name)) {
				directors.push(name);
			}
			if (!seenDirectorIds.has(member.id)) {
				seenDirectorIds.add(member.id);
				directorsList.push({ id: member.id, name, job, department: dept, profileUrl });
			}
		} else if (
			['Screenplay', 'Writer', 'Story', 'Author', 'Co-Writer', 'Original Story'].includes(job) ||
			dept === 'Writing'
		) {
			if (!screenplay.includes(name)) {
				screenplay.push(name);
			}
			if (!seenScreenplayIds.has(member.id)) {
				seenScreenplayIds.add(member.id);
				screenplayList.push({ id: member.id, name, job, department: dept, profileUrl });
			}
		} else if (
			['Producer', 'Executive Producer', 'Co-Producer', 'Associate Producer'].includes(job) ||
			(dept === 'Production' && job.includes('Producer'))
		) {
			if (!producers.includes(name)) {
				producers.push(name);
			}
			if (!seenProducerIds.has(member.id)) {
				seenProducerIds.add(member.id);
				producersList.push({ id: member.id, name, job, department: dept, profileUrl });
			}
		} else if (
			['Director of Photography', 'Cinematography', 'Cinematographer'].includes(job) ||
			dept === 'Camera'
		) {
			if (!cinematography.includes(name)) {
				cinematography.push(name);
			}
			if (!seenCinematographyIds.has(member.id)) {
				seenCinematographyIds.add(member.id);
				cinematographyList.push({ id: member.id, name, job, department: dept, profileUrl });
			}
		} else if (
			['Original Music Composer', 'Composer', 'Music', 'Original Score'].includes(job) ||
			(dept === 'Sound' && (job.includes('Composer') || job.includes('Music')))
		) {
			if (!seenComposerIds.has(member.id)) {
				seenComposerIds.add(member.id);
				composersList.push({ id: member.id, name, job, department: dept, profileUrl });
			}
		} else if (['Editor', 'Film Editor', 'Co-Editor'].includes(job) || dept === 'Editing') {
			if (!seenEditorIds.has(member.id)) {
				seenEditorIds.add(member.id);
				editorsList.push({ id: member.id, name, job, department: dept, profileUrl });
			}
		} else if (['Production Design', 'Production Designer'].includes(job)) {
			if (!seenProdDesignIds.has(member.id)) {
				seenProdDesignIds.add(member.id);
				productionDesignList.push({ id: member.id, name, job, department: dept, profileUrl });
			}
		} else if (['Art Direction', 'Art Director', 'Supervising Art Director'].includes(job)) {
			if (!seenArtDirectionIds.has(member.id)) {
				seenArtDirectionIds.add(member.id);
				artDirectionList.push({ id: member.id, name, job, department: dept, profileUrl });
			}
		} else if (['Costume Design', 'Costume Designer'].includes(job)) {
			if (!seenCostumeDesignIds.has(member.id)) {
				seenCostumeDesignIds.add(member.id);
				costumeDesignList.push({ id: member.id, name, job, department: dept, profileUrl });
			}
		}

		// Keep credited crew members deduplicated by ID + job
		const crewKey = `${member.id}:${job}`;
		if (!seenCrewKeys.has(crewKey)) {
			seenCrewKeys.add(crewKey);
			crew.push({
				id: member.id,
				name,
				job,
				department: dept,
				profileUrl
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

	// Structured production companies
	const productionCompaniesList: ProductionCompanyInfo[] = (details.production_companies || [])
		.filter((c) => Boolean(c && c.id && c.name))
		.map((c) => ({
			id: c.id,
			name: c.name.trim(),
			logoPath: c.logo_path || null,
			logoUrl: getLogoUrl(c.logo_path, 'w300'),
			originCountry: c.origin_country || undefined
		}));

	// Structured production countries
	const productionCountriesList: ProductionCountryInfo[] = (details.production_countries || [])
		.filter((c) => Boolean(c && c.iso_3166_1 && c.name))
		.map((c) => ({
			iso_3166_1: c.iso_3166_1.trim().toUpperCase(),
			name: c.name.trim()
		}));

	// Structured spoken languages
	const spokenLanguagesList: SpokenLanguageInfo[] = (details.spoken_languages || [])
		.filter((l) => Boolean(l && l.iso_639_1))
		.map((l) => ({
			iso_639_1: l.iso_639_1.trim().toLowerCase(),
			name: l.name?.trim() || formatLanguageName(l.iso_639_1) || l.iso_639_1,
			englishName: l.english_name?.trim() || undefined
		}));

	// Structured genres
	const genresList: MovieGenreInfo[] = (details.genres || [])
		.filter((g) => Boolean(g && g.id && g.name))
		.map((g) => ({
			id: g.id,
			name: g.name.trim()
		}));

	return {
		...baseMovie,
		director: directors[0] || baseMovie.director,
		originalTitle,
		originalLanguage: formatLanguageName(details.original_language),
		originalLanguageCode: details.original_language?.trim().toLowerCase() || undefined,
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
		productionCompaniesList,
		productionCountries:
			details.production_countries
				?.map((c) => c.name?.trim())
				.filter((n): n is string => Boolean(n)) || [],
		productionCountriesList,
		spokenLanguagesList,
		genresList,
		cast,
		crew,
		keyCrew: {
			directors,
			screenplay,
			producers,
			cinematography,
			directorsList,
			screenplayList,
			producersList,
			cinematographyList,
			composersList,
			editorsList,
			productionDesignList,
			artDirectionList,
			costumeDesignList
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
		include_adult: options.include_adult ?? false
	};

	if (options.with_genres) {
		params['with_genres'] = String(options.with_genres);
	}

	if (options.with_companies) {
		params['with_companies'] = String(options.with_companies);
	}

	if (options.with_origin_country) {
		params['with_origin_country'] = String(options.with_origin_country).trim();
	}

	if (options.with_original_language) {
		params['with_original_language'] = String(options.with_original_language).trim().toLowerCase();
	}

	if (options.with_people) {
		params['with_people'] = String(options.with_people);
	}

	if (options.with_crew) {
		params['with_crew'] = String(options.with_crew);
	}

	if (options.with_cast) {
		params['with_cast'] = String(options.with_cast);
	}

	const targetYear = options.primary_release_year ?? options.year;
	if (targetYear && targetYear >= 1888 && targetYear <= new Date().getFullYear() + 5) {
		params['primary_release_year'] = targetYear;
	}

	if (options.primary_release_date_gte) {
		params['primary_release_date.gte'] = options.primary_release_date_gte;
	} else if (options.year_gte && options.year_gte >= 1888) {
		params['primary_release_date.gte'] = `${options.year_gte}-01-01`;
	}

	if (options.primary_release_date_lte) {
		params['primary_release_date.lte'] = options.primary_release_date_lte;
	} else if (options.year_lte && options.year_lte >= 1888) {
		params['primary_release_date.lte'] = `${options.year_lte}-12-31`;
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
 * Search people (actors, directors, writers, crew) by name
 */
export async function searchPeople(
	options: { query: string; page?: number; language?: string; include_adult?: boolean },
	fetchFn: typeof fetch = fetch
): Promise<TMDBPaginatedResponse<TMDBPersonSearchResult>> {
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

	return tmdbFetch<TMDBPaginatedResponse<TMDBPersonSearchResult>>(
		'/search/person',
		{
			query: trimmedQuery.slice(0, 150),
			page,
			language: options.language ?? 'en-US',
			include_adult: options.include_adult ?? false
		},
		fetchFn
	);
}

/**
 * Transform raw TMDB person search result into Cineva SearchPerson model
 */
export function mapTMDBPersonSearchResult(item: TMDBPersonSearchResult): SearchPerson {
	const knownForTitles = (item.known_for || [])
		.map((k) => k.title || k.original_title || '')
		.filter((t): t is string => Boolean(t && t.trim() !== ''));

	return {
		id: String(item.id),
		name: item.name?.trim() || 'Unknown',
		profileUrl: getProfileUrl(item.profile_path, 'w185'),
		knownForDepartment: item.known_for_department?.trim() || undefined,
		knownForTitles,
		popularity: typeof item.popularity === 'number' ? Number(item.popularity.toFixed(1)) : undefined
	};
}

/**
 * Search production companies by name
 */
export async function searchCompanies(
	options: { query: string; page?: number },
	fetchFn: typeof fetch = fetch
): Promise<TMDBPaginatedResponse<TMDBCompanySearchResult>> {
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

	return tmdbFetch<TMDBPaginatedResponse<TMDBCompanySearchResult>>(
		'/search/company',
		{
			query: trimmedQuery.slice(0, 150),
			page
		},
		fetchFn
	);
}

/**
 * Transform raw TMDB company search result into Cineva SearchCompany model
 */
export function mapTMDBCompanySearchResult(item: TMDBCompanySearchResult): SearchCompany {
	return {
		id: String(item.id),
		name: item.name?.trim() || 'Unknown Company',
		logoUrl: getLogoUrl(item.logo_path, 'w300'),
		originCountry: item.origin_country?.trim() || undefined
	};
}

/**
 * Unified discovery and multi-entity search orchestrator
 */
export async function unifiedSearch(
	options: UnifiedSearchOptions,
	fetchFn: typeof fetch = fetch
): Promise<UnifiedSearchResult> {
	const rawQuery = (options.query || '').trim();
	const currentPage = Math.max(1, Math.min(500, options.page ?? 1));
	const genres = await getMovieGenres(fetchFn).catch(() => []);

	const interpretation = interpretQuery(rawQuery);

	let resolvedGenreId: number | undefined = options.genre ? Number(options.genre) : undefined;
	let resolvedGenreName: string | undefined = undefined;

	if (!resolvedGenreId && interpretation.discoveryFilters.genreId) {
		resolvedGenreId = interpretation.discoveryFilters.genreId;
		resolvedGenreName = interpretation.discoveryFilters.genreName;
	} else if (resolvedGenreId) {
		const found = genres.find((g) => g.id === resolvedGenreId);
		resolvedGenreName = found?.name || GENRE_MAP[resolvedGenreId];
	}

	let resolvedYear: number | undefined =
		options.year && !isNaN(options.year) ? options.year : undefined;
	if (!resolvedYear && interpretation.discoveryFilters.year) {
		resolvedYear = interpretation.discoveryFilters.year;
	}

	let resolvedLanguage: string | undefined = options.language?.trim().toLowerCase();
	if (!resolvedLanguage && interpretation.discoveryFilters.languageCode) {
		resolvedLanguage = interpretation.discoveryFilters.languageCode;
	}

	let resolvedCountry: string | undefined = options.country?.trim().toUpperCase();
	if (!resolvedCountry && interpretation.discoveryFilters.countryCode) {
		resolvedCountry = interpretation.discoveryFilters.countryCode;
	}

	let resolvedCompany: string | number | undefined = options.company;
	if (!resolvedCompany && interpretation.discoveryFilters.companyId) {
		resolvedCompany = interpretation.discoveryFilters.companyId;
	}

	const minRating =
		typeof options.minRating === 'number' && options.minRating > 0 ? options.minRating : undefined;
	const sortBy = options.sortBy || 'popularity.desc';

	const hasActiveFilters = Boolean(
		resolvedGenreId ||
		resolvedYear ||
		resolvedLanguage ||
		resolvedCountry ||
		resolvedCompany ||
		minRating
	);

	let movies: Movie[] = [];
	let people: SearchPerson[] = [];
	let companies: SearchCompany[] = [];
	let totalResults = 0;
	let totalPages = 0;

	if (!rawQuery && !hasActiveFilters) {
		return {
			query: '',
			interpretation,
			movies: [],
			people: [],
			companies: [],
			activeFilters: [],
			totalResults: 0,
			totalPages: 0,
			page: 1,
			error: null,
			genres
		};
	}

	// Route 1: Pure Year query, or Metadata-filtered discovery query, or user applied metadata filters
	if (
		interpretation.isYearOnly ||
		(interpretation.isMetadataDiscovery && !interpretation.titleWithYear) ||
		(hasActiveFilters &&
			(!rawQuery ||
				rawQuery === String(resolvedYear) ||
				resolveGenre(rawQuery) ||
				resolveLanguage(rawQuery) ||
				resolveCountry(rawQuery)))
	) {
		let crewFilter: number | undefined = undefined;
		let castFilter: number | undefined = undefined;

		if (interpretation.personIntent) {
			const personRes = await searchPeople(
				{ query: interpretation.personIntent.name },
				fetchFn
			).catch(() => null);
			if (personRes?.results && personRes.results.length > 0) {
				const topPerson = personRes.results[0];
				people = personRes.results.slice(0, 3).map(mapTMDBPersonSearchResult);
				if (interpretation.personIntent.role === 'director') {
					crewFilter = topPerson.id;
				} else if (interpretation.personIntent.role === 'actor') {
					castFilter = topPerson.id;
				}
			}
		}

		const discoverData = await discoverMovies(
			{
				page: currentPage,
				with_genres: resolvedGenreId,
				primary_release_year: resolvedYear,
				with_original_language: resolvedLanguage,
				with_origin_country: resolvedCountry,
				with_companies: resolvedCompany,
				with_crew: crewFilter,
				with_cast: castFilter,
				min_rating: minRating,
				sort_by: sortBy,
				include_adult: options.includeAdult
			},
			fetchFn
		);

		movies = (discoverData.results || []).map((m) => mapTMDBMovieToMovie(m));
		totalPages = discoverData.total_pages || 0;
		totalResults = discoverData.total_results || 0;
	} else if (interpretation.titleWithYear) {
		// Route 2: Title with release year, e.g. "Dune 2024"
		const { title, year } = interpretation.titleWithYear;
		const searchData = await searchMovies(
			{
				query: title,
				primary_release_year: year,
				page: currentPage,
				include_adult: options.includeAdult
			},
			fetchFn
		);

		if (searchData.results && searchData.results.length > 0) {
			movies = searchData.results.map((m) => mapTMDBMovieToMovie(m));
			totalPages = searchData.total_pages || 0;
			totalResults = searchData.total_results || 0;
		} else if (currentPage === 1) {
			// Fallback: search raw query string if year constraint yielded no matches
			const fallbackData = await searchMovies(
				{ query: rawQuery, page: currentPage, include_adult: options.includeAdult },
				fetchFn
			);
			movies = (fallbackData.results || []).map((m) => mapTMDBMovieToMovie(m));
			totalPages = fallbackData.total_pages || 0;
			totalResults = fallbackData.total_results || 0;
		}
	} else {
		// Route 3: General Text Query (e.g. "Interstellar", "Christopher Nolan", "Warner Bros.")
		const [movieResult, personResult, companyResult] = await Promise.allSettled([
			searchMovies(
				{ query: rawQuery, page: currentPage, include_adult: options.includeAdult },
				fetchFn
			),
			searchPeople(
				{ query: rawQuery, page: currentPage, include_adult: options.includeAdult },
				fetchFn
			),
			rawQuery.length >= 3
				? searchCompanies({ query: rawQuery, page: 1 }, fetchFn)
				: Promise.resolve(null)
		]);

		if (movieResult.status === 'rejected') {
			throw movieResult.reason;
		}
		if (movieResult.status === 'fulfilled' && movieResult.value) {
			movies = (movieResult.value.results || []).map((m) => mapTMDBMovieToMovie(m));
			totalPages = movieResult.value.total_pages || 0;
			totalResults = movieResult.value.total_results || 0;
		}

		if (personResult.status === 'fulfilled' && personResult.value) {
			people = (personResult.value.results || []).slice(0, 8).map(mapTMDBPersonSearchResult);
		}

		if (
			companyResult.status === 'fulfilled' &&
			companyResult.value &&
			companyResult.value.results
		) {
			companies = companyResult.value.results.slice(0, 4).map(mapTMDBCompanySearchResult);
		}

		// If movies is empty, but top person matched (e.g. Christopher Nolan, Cillian Murphy):
		// provide filmography credits so the user immediately discovers their films
		if (movies.length === 0 && people.length > 0) {
			const topPersonId = people[0].id;
			const personCredits = await getPersonMovieCredits(topPersonId, fetchFn).catch(() => null);
			if (personCredits) {
				const castMovies = (personCredits.cast || []).map((m) =>
					mapTMDBMovieToMovie({
						...m,
						title: m.title || m.original_title || 'Untitled',
						overview: m.overview || '',
						poster_path: m.poster_path || null,
						backdrop_path: m.backdrop_path || null,
						vote_average: m.vote_average ?? 0,
						vote_count: m.vote_count ?? 0
					})
				);
				const crewMovies = (personCredits.crew || []).map((m) =>
					mapTMDBMovieToMovie({
						...m,
						title: m.title || m.original_title || 'Untitled',
						overview: m.overview || '',
						poster_path: m.poster_path || null,
						backdrop_path: m.backdrop_path || null,
						vote_average: m.vote_average ?? 0,
						vote_count: m.vote_count ?? 0
					})
				);
				const seenIds = new Set<string>();
				const combined: Movie[] = [];
				for (const m of [...crewMovies, ...castMovies]) {
					if (!seenIds.has(m.id)) {
						seenIds.add(m.id);
						combined.push(m);
					}
				}
				combined.sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0));
				movies = combined.slice(0, 20);
				totalResults = movies.length;
				totalPages = 1;
			}
		}
	}

	const activeFilters = buildActiveFilterItems({
		genre: resolvedGenreId,
		genreName: resolvedGenreName,
		year: resolvedYear,
		minRating,
		language: resolvedLanguage,
		country: resolvedCountry,
		company: resolvedCompany,
		sortBy: sortBy !== 'popularity.desc' ? sortBy : undefined
	});

	return {
		query: rawQuery,
		interpretation,
		movies,
		people,
		companies,
		activeFilters,
		totalResults,
		totalPages,
		page: currentPage,
		error: null,
		genres
	};
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
 * Fetch company details by TMDB company ID
 */
export async function getCompanyDetails(
	companyId: number | string,
	fetchFn: typeof fetch = fetch
): Promise<TMDBCompanyDetails> {
	return tmdbFetch<TMDBCompanyDetails>(`/company/${companyId}`, {}, fetchFn);
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
 * Transform raw TMDB person and movie credits into Cineva's PersonProfile model
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

	// Helper to build a PersonCreditMovie from crew item
	const createCrewCreditMovie = (item: TMDBPersonCrewCredit, jobStr: string): PersonCreditMovie => {
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

		return {
			id: String(item.id),
			title: item.title || item.original_title || 'Untitled',
			overview: item.overview || '',
			releaseYear: year,
			rating,
			voteCount: item.vote_count || 0,
			genres: genreNames,
			posterUrl: getPosterUrl(item.poster_path, 'w500'),
			backdropUrl: getBackdropUrl(item.backdrop_path, 'w1280'),
			job: jobStr,
			department: item.department?.trim() || undefined,
			releaseDateText: dateText,
			rawReleaseDate: item.release_date || ''
		};
	};

	const rawCrew = credits?.crew || [];
	const directingCreditsMap = new Map<number, PersonCreditMovie>();
	const writingCreditsMap = new Map<number, PersonCreditMovie>();
	const producingCreditsMap = new Map<number, PersonCreditMovie>();
	const cinematographyCreditsMap = new Map<number, PersonCreditMovie>();
	const otherCrewCreditsMap = new Map<number, PersonCreditMovie>();

	const addToCategory = (
		map: Map<number, PersonCreditMovie>,
		item: TMDBPersonCrewCredit,
		jobName: string
	) => {
		const movieId = item.id;
		if (map.has(movieId)) {
			const existing = map.get(movieId)!;
			if (jobName && existing.job && !existing.job.includes(jobName)) {
				existing.job = `${existing.job} / ${jobName}`;
			}
			return;
		}
		map.set(movieId, createCrewCreditMovie(item, jobName));
	};

	for (const item of rawCrew) {
		if (!item || !item.id) continue;
		const job = item.job?.trim() || 'Crew';
		const dept = item.department?.trim() || '';

		if (job === 'Director') {
			addToCategory(directingCreditsMap, item, 'Director');
		} else if (
			dept === 'Writing' ||
			[
				'Screenplay',
				'Writer',
				'Story',
				'Author',
				'Co-Writer',
				'Original Story',
				'Dialogue',
				'Scenario'
			].includes(job)
		) {
			addToCategory(writingCreditsMap, item, job);
		} else if (
			dept === 'Production' ||
			[
				'Producer',
				'Executive Producer',
				'Co-Producer',
				'Associate Producer',
				'Line Producer',
				'Supervising Producer'
			].includes(job)
		) {
			addToCategory(producingCreditsMap, item, job);
		} else if (
			dept === 'Camera' ||
			['Director of Photography', 'Cinematography', 'Cinematographer'].includes(job)
		) {
			addToCategory(cinematographyCreditsMap, item, job);
		} else {
			addToCategory(otherCrewCreditsMap, item, job);
		}
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
	const writingCredits = Array.from(writingCreditsMap.values()).sort(sortCreditsDesc);
	const producingCredits = Array.from(producingCreditsMap.values()).sort(sortCreditsDesc);
	const cinematographyCredits = Array.from(cinematographyCreditsMap.values()).sort(sortCreditsDesc);
	const otherCrewCredits = Array.from(otherCrewCreditsMap.values()).sort(sortCreditsDesc);

	const uniqueMovieIds = new Set([
		...Array.from(actingCreditsMap.keys()),
		...Array.from(directingCreditsMap.keys()),
		...Array.from(writingCreditsMap.keys()),
		...Array.from(producingCreditsMap.keys()),
		...Array.from(cinematographyCreditsMap.keys()),
		...Array.from(otherCrewCreditsMap.keys())
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
		writingCredits,
		producingCredits,
		cinematographyCredits,
		otherCrewCredits,
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
