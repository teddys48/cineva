/**
 * Centralized TMDB Image URL helpers (client and server safe)
 */

export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/**
 * Build a valid TMDB poster image URL with fallback to empty string
 */
export function getPosterUrl(
	posterPath: string | null | undefined,
	size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
): string {
	if (!posterPath) return '';
	return `${TMDB_IMAGE_BASE_URL}/${size}${posterPath.startsWith('/') ? posterPath : `/${posterPath}`}`;
}

/**
 * Build a valid TMDB backdrop image URL with fallback to empty string
 */
export function getBackdropUrl(
	backdropPath: string | null | undefined,
	size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'
): string {
	if (!backdropPath) return '';
	return `${TMDB_IMAGE_BASE_URL}/${size}${backdropPath.startsWith('/') ? backdropPath : `/${backdropPath}`}`;
}

/**
 * Build a valid TMDB logo image URL with fallback to empty string
 */
export function getLogoUrl(
	logoPath: string | null | undefined,
	size: 'w45' | 'w92' | 'w154' | 'w185' | 'w300' | 'w500' | 'original' = 'w300'
): string {
	if (!logoPath) return '';
	return `${TMDB_IMAGE_BASE_URL}/${size}${logoPath.startsWith('/') ? logoPath : `/${logoPath}`}`;
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
 * Generic TMDB image URL builder
 */
export function getTMDBImageUrl(
	filePath: string | null | undefined,
	size: string = 'original'
): string {
	if (!filePath) return '';
	return `${TMDB_IMAGE_BASE_URL}/${size}${filePath.startsWith('/') ? filePath : `/${filePath}`}`;
}
