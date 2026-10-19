import type {
	QueryInterpretation,
	DiscoveryFilterSuggestion,
	ActiveFilterItem
} from './types/search';

/**
 * Standard TMDB movie genre dictionary
 */
export const GENRE_MAP: Record<number, string> = {
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
 * Common genre aliases and variations mapped to TMDB genre ID
 */
export const GENRE_ALIASES: Record<string, number> = {
	action: 28,
	adventure: 12,
	animation: 16,
	animated: 16,
	anime: 16,
	cartoon: 16,
	cartoons: 16,
	comedy: 35,
	funny: 35,
	comedies: 35,
	crime: 80,
	gangster: 80,
	mafia: 80,
	documentary: 99,
	documentaries: 99,
	doc: 99,
	docs: 99,
	drama: 18,
	dramas: 18,
	family: 10751,
	kids: 10751,
	children: 10751,
	fantasy: 14,
	history: 36,
	historical: 36,
	period: 36,
	horror: 27,
	scary: 27,
	spooky: 27,
	music: 10402,
	musical: 10402,
	musicals: 10402,
	mystery: 9648,
	mysteries: 9648,
	detective: 9648,
	romance: 10749,
	romantic: 10749,
	'rom-com': 10749,
	romcom: 10749,
	love: 10749,
	'sci-fi': 878,
	scifi: 878,
	'science fiction': 878,
	'science-fiction': 878,
	sf: 878,
	'tv movie': 10770,
	'tv-movie': 10770,
	thriller: 53,
	thrillers: 53,
	suspense: 53,
	war: 10752,
	military: 10752,
	western: 37,
	westerns: 37,
	cowboy: 37
};

/**
 * Common language names and aliases mapped to ISO 639-1 alpha-2 codes
 */
export const LANGUAGE_MAP: Record<string, { code: string; name: string }> = {
	japanese: { code: 'ja', name: 'Japanese' },
	english: { code: 'en', name: 'English' },
	korean: { code: 'ko', name: 'Korean' },
	french: { code: 'fr', name: 'French' },
	spanish: { code: 'es', name: 'Spanish' },
	german: { code: 'de', name: 'German' },
	italian: { code: 'it', name: 'Italian' },
	chinese: { code: 'zh', name: 'Chinese' },
	mandarin: { code: 'zh', name: 'Chinese' },
	cantonese: { code: 'zh', name: 'Chinese' },
	hindi: { code: 'hi', name: 'Hindi' },
	portuguese: { code: 'pt', name: 'Portuguese' },
	russian: { code: 'ru', name: 'Russian' },
	swedish: { code: 'sv', name: 'Swedish' },
	danish: { code: 'da', name: 'Danish' },
	norwegian: { code: 'no', name: 'Norwegian' },
	thai: { code: 'th', name: 'Thai' },
	polish: { code: 'pl', name: 'Polish' },
	indonesian: { code: 'id', name: 'Indonesian' },
	arabic: { code: 'ar', name: 'Arabic' },
	turkish: { code: 'tr', name: 'Turkish' },
	dutch: { code: 'nl', name: 'Dutch' }
};

/**
 * Common country names and aliases mapped to ISO 3166-1 alpha-2 codes
 */
export const COUNTRY_MAP: Record<string, { code: string; name: string }> = {
	japan: { code: 'JP', name: 'Japan' },
	'united states': { code: 'US', name: 'United States' },
	'united states of america': { code: 'US', name: 'United States' },
	usa: { code: 'US', name: 'United States' },
	us: { code: 'US', name: 'United States' },
	america: { code: 'US', name: 'United States' },
	'united kingdom': { code: 'GB', name: 'United Kingdom' },
	uk: { code: 'GB', name: 'United Kingdom' },
	'great britain': { code: 'GB', name: 'United Kingdom' },
	britain: { code: 'GB', name: 'United Kingdom' },
	england: { code: 'GB', name: 'United Kingdom' },
	france: { code: 'FR', name: 'France' },
	'south korea': { code: 'KR', name: 'South Korea' },
	korea: { code: 'KR', name: 'South Korea' },
	germany: { code: 'DE', name: 'Germany' },
	italy: { code: 'IT', name: 'Italy' },
	canada: { code: 'CA', name: 'Canada' },
	spain: { code: 'ES', name: 'Spain' },
	australia: { code: 'AU', name: 'Australia' },
	india: { code: 'IN', name: 'India' },
	china: { code: 'CN', name: 'China' },
	'hong kong': { code: 'HK', name: 'Hong Kong' },
	taiwan: { code: 'TW', name: 'Taiwan' },
	brazil: { code: 'BR', name: 'Brazil' },
	mexico: { code: 'MX', name: 'Mexico' },
	ireland: { code: 'IE', name: 'Ireland' },
	sweden: { code: 'SE', name: 'Sweden' },
	denmark: { code: 'DK', name: 'Denmark' },
	norway: { code: 'NO', name: 'Norway' },
	'new zealand': { code: 'NZ', name: 'New Zealand' }
};

/**
 * Well-known production company aliases
 */
export const NOTABLE_COMPANIES: Record<string, { id: number; name: string }> = {
	'warner bros.': { id: 174, name: 'Warner Bros. Pictures' },
	'warner bros': { id: 174, name: 'Warner Bros. Pictures' },
	'warner brothers': { id: 174, name: 'Warner Bros. Pictures' },
	warner: { id: 174, name: 'Warner Bros. Pictures' },
	'universal pictures': { id: 33, name: 'Universal Pictures' },
	universal: { id: 33, name: 'Universal Pictures' },
	paramount: { id: 4, name: 'Paramount' },
	'paramount pictures': { id: 4, name: 'Paramount' },
	a24: { id: 41077, name: 'A24' },
	'columbia pictures': { id: 5, name: 'Columbia Pictures' },
	'walt disney pictures': { id: 2, name: 'Walt Disney Pictures' },
	disney: { id: 2, name: 'Walt Disney Pictures' },
	pixar: { id: 3, name: 'Pixar' },
	'studio ghibli': { id: 10342, name: 'Studio Ghibli' },
	ghibli: { id: 10342, name: 'Studio Ghibli' },
	'marvel studios': { id: 420, name: 'Marvel Studios' },
	lucasfilm: { id: 1, name: 'Lucasfilm Ltd.' },
	'20th century studios': { id: 127928, name: '20th Century Studios' },
	'20th century fox': { id: 127928, name: '20th Century Studios' },
	lionsgate: { id: 1632, name: 'Lionsgate' },
	'sony pictures': { id: 34, name: 'Sony Pictures' },
	syncopy: { id: 9298, name: 'Syncopy' }
};

/**
 * Resolve genre ID by name or alias
 */
export function resolveGenre(text: string): { id: number; name: string } | null {
	const normalized = text.trim().toLowerCase();
	if (GENRE_ALIASES[normalized]) {
		const id = GENRE_ALIASES[normalized];
		return { id, name: GENRE_MAP[id] || normalized };
	}
	return null;
}

/**
 * Resolve language code by name or alias
 */
export function resolveLanguage(text: string): { code: string; name: string } | null {
	const normalized = text.trim().toLowerCase();
	if (LANGUAGE_MAP[normalized]) {
		return LANGUAGE_MAP[normalized];
	}
	return null;
}

/**
 * Resolve country code by name or alias
 */
export function resolveCountry(text: string): { code: string; name: string } | null {
	const normalized = text.trim().toLowerCase();
	if (COUNTRY_MAP[normalized]) {
		return COUNTRY_MAP[normalized];
	}
	return null;
}

/**
 * Resolve known production company by name
 */
export function resolveNotableCompany(text: string): { id: number; name: string } | null {
	const normalized = text.trim().toLowerCase();
	if (NOTABLE_COMPANIES[normalized]) {
		return NOTABLE_COMPANIES[normalized];
	}
	return null;
}

/**
 * Parses a query string to determine whether it is a direct title/person search,
 * a pure year query, or a metadata discovery query.
 */
export function interpretQuery(raw: string): QueryInterpretation {
	const rawQuery = (raw || '').trim();
	const currentYear = new Date().getFullYear();

	const defaultResult: QueryInterpretation = {
		rawQuery,
		isYearOnly: false,
		isMetadataDiscovery: false,
		discoveryFilters: {}
	};

	if (!rawQuery) {
		return defaultResult;
	}

	// 1. Check if query is strictly a 4-digit release year: e.g. "2024"
	const pureYearMatch = /^(?:18|19|20)\d{2}$/.test(rawQuery);
	if (pureYearMatch) {
		const yearVal = parseInt(rawQuery, 10);
		if (yearVal >= 1888 && yearVal <= currentYear + 5) {
			return {
				rawQuery,
				isYearOnly: true,
				year: yearVal,
				isMetadataDiscovery: true,
				discoveryFilters: { year: yearVal }
			};
		}
	}

	// 2. Check director intent: "movies directed by Christopher Nolan", "directed by Christopher Nolan", "director Christopher Nolan"
	const directorMatch =
		/^(?:movies?\s+)?directed\s+by\s+(.+)$/i.exec(rawQuery) || /^director\s+(.+)$/i.exec(rawQuery);
	if (directorMatch && directorMatch[1]) {
		const directorName = directorMatch[1].trim();
		return {
			rawQuery,
			isYearOnly: false,
			isMetadataDiscovery: true,
			personIntent: { name: directorName, role: 'director' },
			discoveryFilters: { directorName },
			residualTitleQuery: directorName
		};
	}

	// 3. Check actor intent: "movies starring Cillian Murphy", "starring Cillian Murphy", "actor Cillian Murphy"
	const actorMatch =
		/^(?:movies?\s+)?starring\s+(.+)$/i.exec(rawQuery) ||
		/^(?:actor|actress)\s+(.+)$/i.exec(rawQuery);
	if (actorMatch && actorMatch[1]) {
		const actorName = actorMatch[1].trim();
		return {
			rawQuery,
			isYearOnly: false,
			isMetadataDiscovery: true,
			personIntent: { name: actorName, role: 'actor' },
			discoveryFilters: { actorName },
			residualTitleQuery: actorName
		};
	}

	// 4. Check "movies from <year>" or "films from <year>"
	const moviesFromYearMatch = /^(?:movies?|films?)\s+(?:from|in)\s+((?:18|19|20)\d{2})$/i.exec(
		rawQuery
	);
	if (moviesFromYearMatch && moviesFromYearMatch[1]) {
		const yearVal = parseInt(moviesFromYearMatch[1], 10);
		if (yearVal >= 1888 && yearVal <= currentYear + 5) {
			return {
				rawQuery,
				isYearOnly: false,
				year: yearVal,
				isMetadataDiscovery: true,
				discoveryFilters: { year: yearVal }
			};
		}
	}

	// 5. Check combined genre + year:
	// e.g. "action movies from 2023", "action in 2023", "action 2023", "sci-fi 2024"
	const genreYearRegex =
		/^(.+?)(?:\s+movies?|\s+films?)?(?:\s+from|\s+in|\s+released)?\s+((?:18|19|20)\d{2})$/i;
	const genreYearMatch = genreYearRegex.exec(rawQuery);
	if (genreYearMatch) {
		const possibleGenre = genreYearMatch[1].trim();
		const yearVal = parseInt(genreYearMatch[2], 10);
		const resolvedG = resolveGenre(possibleGenre);

		if (resolvedG && yearVal >= 1888 && yearVal <= currentYear + 5) {
			return {
				rawQuery,
				isYearOnly: false,
				year: yearVal,
				genre: resolvedG,
				isMetadataDiscovery: true,
				discoveryFilters: {
					genreId: resolvedG.id,
					genreName: resolvedG.name,
					year: yearVal
				}
			};
		}
	}

	// 6. Check combined language + genre: e.g. "Japanese animation", "French drama", "Korean thriller"
	const words = rawQuery.split(/\s+/);
	if (words.length === 2) {
		const langResolved = resolveLanguage(words[0]);
		const genreResolved = resolveGenre(words[1]);
		if (langResolved && genreResolved) {
			return {
				rawQuery,
				isYearOnly: false,
				language: langResolved,
				genre: genreResolved,
				isMetadataDiscovery: true,
				discoveryFilters: {
					languageCode: langResolved.code,
					languageName: langResolved.name,
					genreId: genreResolved.id,
					genreName: genreResolved.name
				}
			};
		}

		// Also check country + genre: e.g. "Japan animation", "Korea drama"
		const countryResolved = resolveCountry(words[0]);
		if (countryResolved && genreResolved) {
			return {
				rawQuery,
				isYearOnly: false,
				country: countryResolved,
				genre: genreResolved,
				isMetadataDiscovery: true,
				discoveryFilters: {
					countryCode: countryResolved.code,
					countryName: countryResolved.name,
					genreId: genreResolved.id,
					genreName: genreResolved.name
				}
			};
		}
	}

	// 7. Check country films: e.g. "Japanese movies", "films from Japan", "movies from France"
	const countryFromMatch =
		/^(?:movies?|films?)\s+(?:from|produced in|in)\s+(.+)$/i.exec(rawQuery) ||
		/^(.+?)\s+(?:movies?|films?|cinema)$/i.exec(rawQuery);
	if (countryFromMatch && countryFromMatch[1]) {
		const target = countryFromMatch[1].trim();
		const countryResolved = resolveCountry(target);
		const langResolved = resolveLanguage(target);
		if (countryResolved || langResolved) {
			return {
				rawQuery,
				isYearOnly: false,
				country: countryResolved ?? undefined,
				language: langResolved ?? undefined,
				isMetadataDiscovery: true,
				discoveryFilters: {
					countryCode: countryResolved?.code,
					countryName: countryResolved?.name,
					languageCode: langResolved?.code,
					languageName: langResolved?.name
				}
			};
		}
	}

	// 8. Check Title plus Year: e.g. "Dune 2024", "Avatar 2009", "Spider-Man 2002"
	const titleYearMatch = /^(.+?)\s+((?:18|19|20)\d{2})$/i.exec(rawQuery);
	if (titleYearMatch) {
		const extractedTitle = titleYearMatch[1].trim();
		const extractedYear = parseInt(titleYearMatch[2], 10);
		// Ensure extractedTitle is not a pure genre/language/country (already handled above)
		if (
			extractedYear >= 1888 &&
			extractedYear <= currentYear + 5 &&
			!resolveGenre(extractedTitle) &&
			!resolveLanguage(extractedTitle) &&
			!resolveCountry(extractedTitle)
		) {
			return {
				rawQuery,
				isYearOnly: false,
				titleWithYear: {
					title: extractedTitle,
					year: extractedYear
				},
				isMetadataDiscovery: false,
				discoveryFilters: {
					year: extractedYear
				},
				residualTitleQuery: extractedTitle
			};
		}
	}

	// 9. Check notable production company match: e.g. "Warner Bros.", "A24", "Universal Pictures"
	const companyResolved = resolveNotableCompany(rawQuery);
	if (companyResolved) {
		return {
			rawQuery,
			isYearOnly: false,
			isMetadataDiscovery: true,
			discoveryFilters: {
				companyId: companyResolved.id,
				companyName: companyResolved.name
			}
		};
	}

	// 10. Check exact single genre: e.g. "sci-fi", "science fiction", "action", "comedy"
	const singleGenre = resolveGenre(rawQuery);
	if (singleGenre) {
		return {
			rawQuery,
			isYearOnly: false,
			genre: singleGenre,
			isMetadataDiscovery: true,
			discoveryFilters: {
				genreId: singleGenre.id,
				genreName: singleGenre.name
			}
		};
	}

	// 11. Check exact single country: e.g. "Japan", "United States"
	const singleCountry = resolveCountry(rawQuery);
	if (singleCountry) {
		return {
			rawQuery,
			isYearOnly: false,
			country: singleCountry,
			isMetadataDiscovery: true,
			discoveryFilters: {
				countryCode: singleCountry.code,
				countryName: singleCountry.name
			}
		};
	}

	// 12. Check exact single language: e.g. "Japanese", "English"
	const singleLanguage = resolveLanguage(rawQuery);
	if (singleLanguage) {
		return {
			rawQuery,
			isYearOnly: false,
			language: singleLanguage,
			isMetadataDiscovery: true,
			discoveryFilters: {
				languageCode: singleLanguage.code,
				languageName: singleLanguage.name
			}
		};
	}

	return defaultResult;
}

/**
 * Generate smart discovery suggestions based on the user's input
 */
export function generateDiscoverySuggestions(query: string): DiscoveryFilterSuggestion[] {
	const trimmed = (query || '').trim();
	if (!trimmed || trimmed.length < 2) return [];

	const interpretation = interpretQuery(trimmed);
	const suggestions: DiscoveryFilterSuggestion[] = [];

	// 1. Year suggestion
	if (interpretation.isYearOnly && interpretation.year) {
		suggestions.push({
			type: 'year',
			label: `Films released in ${interpretation.year}`,
			description: `Explore all cinematic titles from ${interpretation.year}`,
			query: String(interpretation.year),
			url: `/search?year=${interpretation.year}`,
			badge: 'Year',
			filters: { year: interpretation.year }
		});
	}

	// 2. Title with Year suggestion
	if (interpretation.titleWithYear) {
		const { title, year } = interpretation.titleWithYear;
		suggestions.push({
			type: 'combined',
			label: `"${title}" from ${year}`,
			description: `Filter "${title}" titles released in ${year}`,
			query: `${title} ${year}`,
			url: `/search?query=${encodeURIComponent(title)}&year=${year}`,
			badge: 'Title + Year',
			filters: { query: title, year }
		});
	}

	// 3. Combined Genre + Year
	if (
		interpretation.genre &&
		interpretation.year &&
		interpretation.genre.id &&
		interpretation.year
	) {
		suggestions.push({
			type: 'combined',
			label: `${interpretation.genre.name} films from ${interpretation.year}`,
			description: `Discover movies matching ${interpretation.genre.name} released in ${interpretation.year}`,
			query: `${interpretation.genre.name} ${interpretation.year}`,
			url: `/search?genre=${interpretation.genre.id}&year=${interpretation.year}`,
			badge: 'Genre + Year',
			filters: { genre: interpretation.genre.id, year: interpretation.year }
		});
	}

	// 4. Combined Language + Genre
	if (interpretation.language && interpretation.genre) {
		suggestions.push({
			type: 'combined',
			label: `${interpretation.language.name} ${interpretation.genre.name} films`,
			description: `Discover ${interpretation.genre.name} cinema with original language ${interpretation.language.name}`,
			query: `${interpretation.language.name} ${interpretation.genre.name}`,
			url: `/search?genre=${interpretation.genre.id}&language=${interpretation.language.code}`,
			badge: 'Language + Genre',
			filters: { genre: interpretation.genre.id, language: interpretation.language.code }
		});
	}

	// 5. Single Genre match or partial match
	if (interpretation.genre && !interpretation.year && !interpretation.language) {
		suggestions.push({
			type: 'genre',
			label: `${interpretation.genre.name} movies`,
			description: `Explore all titles in the ${interpretation.genre.name} genre`,
			query: interpretation.genre.name,
			url: `/search?genre=${interpretation.genre.id}`,
			badge: 'Genre',
			filters: { genre: interpretation.genre.id }
		});
	} else if (!interpretation.genre) {
		// Check if query matches any genre as substring/prefix
		const qLower = trimmed.toLowerCase();
		for (const [alias, id] of Object.entries(GENRE_ALIASES)) {
			if (alias.startsWith(qLower) && alias !== qLower) {
				const gName = GENRE_MAP[id];
				if (gName && !suggestions.some((s) => s.label.includes(gName))) {
					suggestions.push({
						type: 'genre',
						label: `${gName} movies`,
						description: `Explore titles in ${gName}`,
						query: gName,
						url: `/search?genre=${id}`,
						badge: 'Genre',
						filters: { genre: id }
					});
					if (suggestions.length >= 2) break;
				}
			}
		}
	}

	// 6. Country match
	if (interpretation.country) {
		suggestions.push({
			type: 'country',
			label: `Films from ${interpretation.country.name}`,
			description: `Discover cinema produced in ${interpretation.country.name}`,
			query: interpretation.country.name,
			url: `/search?country=${interpretation.country.code}`,
			badge: 'Country',
			filters: { country: interpretation.country.code }
		});
	}

	// 7. Language match
	if (interpretation.language && !interpretation.genre) {
		suggestions.push({
			type: 'language',
			label: `Films in ${interpretation.language.name}`,
			description: `Discover films with original language ${interpretation.language.name}`,
			query: interpretation.language.name,
			url: `/search?language=${interpretation.language.code}`,
			badge: 'Language',
			filters: { language: interpretation.language.code }
		});
	}

	// 8. Person Intent
	if (interpretation.personIntent) {
		const roleText = interpretation.personIntent.role === 'director' ? 'directed by' : 'starring';
		suggestions.push({
			type: 'person',
			label: `Films ${roleText} ${interpretation.personIntent.name}`,
			description: `Find works by ${interpretation.personIntent.name}`,
			query: interpretation.personIntent.name,
			url: `/search?query=${encodeURIComponent(interpretation.personIntent.name)}`,
			badge: interpretation.personIntent.role === 'director' ? 'Director' : 'Actor',
			filters: { query: interpretation.personIntent.name }
		});
	}

	// 9. Company match
	if (interpretation.discoveryFilters.companyId) {
		suggestions.push({
			type: 'company',
			label: `Films by ${interpretation.discoveryFilters.companyName}`,
			description: `View catalogue produced by ${interpretation.discoveryFilters.companyName}`,
			query: interpretation.discoveryFilters.companyName || '',
			url: `/company/${interpretation.discoveryFilters.companyId}`,
			badge: 'Company',
			filters: { company: interpretation.discoveryFilters.companyId }
		});
	}

	return suggestions.slice(0, 3);
}

/**
 * Format active filter list for UI tags and badges
 */
export function buildActiveFilterItems(filters: {
	genre?: string | number | null;
	genreName?: string | null;
	year?: number | null;
	minRating?: number | null;
	language?: string | null;
	languageName?: string | null;
	country?: string | null;
	countryName?: string | null;
	company?: string | number | null;
	companyName?: string | null;
	sortBy?: string | null;
}): ActiveFilterItem[] {
	const items: ActiveFilterItem[] = [];

	if (filters.genre) {
		const gId = Number(filters.genre);
		const gName = filters.genreName || GENRE_MAP[gId] || `Genre ${gId}`;
		items.push({
			key: 'genre',
			label: 'Genre',
			value: String(filters.genre),
			displayValue: gName
		});
	}

	if (filters.year) {
		items.push({
			key: 'year',
			label: 'Year',
			value: String(filters.year),
			displayValue: String(filters.year)
		});
	}

	if (filters.minRating && filters.minRating > 0) {
		items.push({
			key: 'minRating',
			label: 'Min Rating',
			value: String(filters.minRating),
			displayValue: `${filters.minRating}+ ★`
		});
	}

	if (filters.language) {
		const lCode = String(filters.language).toLowerCase();
		const lName =
			filters.languageName ||
			Object.values(LANGUAGE_MAP).find((l) => l.code === lCode)?.name ||
			lCode.toUpperCase();
		items.push({
			key: 'language',
			label: 'Language',
			value: lCode,
			displayValue: lName
		});
	}

	if (filters.country) {
		const cCode = String(filters.country).toUpperCase();
		const cName =
			filters.countryName ||
			Object.values(COUNTRY_MAP).find((c) => c.code === cCode)?.name ||
			cCode;
		items.push({
			key: 'country',
			label: 'Country',
			value: cCode,
			displayValue: cName
		});
	}

	if (filters.company) {
		items.push({
			key: 'company',
			label: 'Company',
			value: String(filters.company),
			displayValue: filters.companyName || `Company #${filters.company}`
		});
	}

	if (filters.sortBy && filters.sortBy !== 'popularity.desc') {
		const sortLabels: Record<string, string> = {
			'vote_average.desc': 'Highest Rated',
			'vote_average.asc': 'Lowest Rated',
			'primary_release_date.desc': 'Newest First',
			'primary_release_date.asc': 'Oldest First',
			'popularity.asc': 'Least Popular'
		};
		items.push({
			key: 'sortBy',
			label: 'Sorted By',
			value: filters.sortBy,
			displayValue: sortLabels[filters.sortBy] || filters.sortBy
		});
	}

	return items;
}
