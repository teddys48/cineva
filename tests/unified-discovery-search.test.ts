import { describe, it, expect, beforeEach } from 'bun:test';
import {
	interpretQuery,
	resolveGenre,
	resolveLanguage,
	resolveCountry,
	resolveNotableCompany,
	generateDiscoverySuggestions,
	buildActiveFilterItems
} from '../src/lib/search-query';
import {
	unifiedSearch,
	searchPeople,
	searchCompanies,
	mapTMDBPersonSearchResult,
	mapTMDBCompanySearchResult,
	clearCache,
	TMDBError
} from '../src/lib/server/tmdb';
import { GET as getSearchApi } from '../src/routes/api/search/+server';
import { load as loadSearchPage } from '../src/routes/search/+page.server';
import type {
	TMDBPaginatedResponse,
	TMDBMovie,
	TMDBPersonSearchResult,
	TMDBCompanySearchResult
} from '../src/lib/types/tmdb';

function createMockFetch(routes: Record<string, unknown>): typeof fetch {
	return (async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input.toString();

		for (const [pattern, responseData] of Object.entries(routes)) {
			if (url.includes(pattern)) {
				if (responseData instanceof Error) {
					return new Response(JSON.stringify({ status_message: responseData.message }), {
						status: (responseData as TMDBError).status || 500,
						headers: { 'Content-Type': 'application/json' }
					});
				}
				return new Response(JSON.stringify(responseData), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		return new Response(JSON.stringify({ status_message: 'Not found in mock', results: [] }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	}) as typeof fetch;
}

describe('Unified Search & Advanced Movie Discovery', () => {
	beforeEach(() => {
		clearCache();
	});

	describe('1. Query Interpretation Engine', () => {
		it('interprets plain movie titles and partial queries as standard text search', () => {
			const res1 = interpretQuery('Interstellar');
			expect(res1.isYearOnly).toBe(false);
			expect(res1.isMetadataDiscovery).toBe(false);
			expect(res1.rawQuery).toBe('Interstellar');

			const res2 = interpretQuery('inter');
			expect(res2.isYearOnly).toBe(false);
			expect(res2.isMetadataDiscovery).toBe(false);
		});

		it('interprets 4-digit strings as pure release year discovery', () => {
			const res = interpretQuery('2024');
			expect(res.isYearOnly).toBe(true);
			expect(res.year).toBe(2024);
			expect(res.isMetadataDiscovery).toBe(true);
			expect(res.discoveryFilters.year).toBe(2024);
		});

		it('interprets Title plus Year properly (e.g. "Dune 2024")', () => {
			const res = interpretQuery('Dune 2024');
			expect(res.isYearOnly).toBe(false);
			expect(res.titleWithYear).toBeDefined();
			expect(res.titleWithYear?.title).toBe('Dune');
			expect(res.titleWithYear?.year).toBe(2024);
			expect(res.residualTitleQuery).toBe('Dune');
		});

		it('resolves genre aliases case-insensitively to valid TMDB IDs', () => {
			expect(resolveGenre('sci-fi')?.id).toBe(878);
			expect(resolveGenre('Sci-Fi')?.id).toBe(878);
			expect(resolveGenre('science fiction')?.id).toBe(878);
			expect(resolveGenre('action')?.id).toBe(28);
			expect(resolveGenre('comedy')?.id).toBe(35);
			expect(resolveGenre('animation')?.id).toBe(16);
			expect(resolveGenre('anime')?.id).toBe(16);
			expect(resolveGenre('unknown-genre-xyz')).toBeNull();
		});

		it('interprets combined genre and year queries (e.g. "action 2023")', () => {
			const res1 = interpretQuery('action 2023');
			expect(res1.isMetadataDiscovery).toBe(true);
			expect(res1.genre?.id).toBe(28);
			expect(res1.year).toBe(2023);
			expect(res1.discoveryFilters.genreId).toBe(28);
			expect(res1.discoveryFilters.year).toBe(2023);

			const res2 = interpretQuery('action movies from 2023');
			expect(res2.isMetadataDiscovery).toBe(true);
			expect(res2.genre?.id).toBe(28);
			expect(res2.year).toBe(2023);
		});

		it('interprets combined language and genre queries (e.g. "Japanese animation")', () => {
			const res = interpretQuery('Japanese animation');
			expect(res.isMetadataDiscovery).toBe(true);
			expect(res.language?.code).toBe('ja');
			expect(res.genre?.id).toBe(16);
			expect(res.discoveryFilters.languageCode).toBe('ja');
			expect(res.discoveryFilters.genreId).toBe(16);
		});

		it('interprets director and actor intents', () => {
			const res1 = interpretQuery('movies directed by Christopher Nolan');
			expect(res1.personIntent?.name).toBe('Christopher Nolan');
			expect(res1.personIntent?.role).toBe('director');

			const res2 = interpretQuery('starring Cillian Murphy');
			expect(res2.personIntent?.name).toBe('Cillian Murphy');
			expect(res2.personIntent?.role).toBe('actor');
		});

		it('resolves country and language names to ISO codes', () => {
			expect(resolveCountry('Japan')?.code).toBe('JP');
			expect(resolveCountry('United States')?.code).toBe('US');
			expect(resolveCountry('france')?.code).toBe('FR');

			expect(resolveLanguage('Japanese')?.code).toBe('ja');
			expect(resolveLanguage('English')?.code).toBe('en');
			expect(resolveLanguage('korean')?.code).toBe('ko');
		});

		it('resolves notable production company names', () => {
			expect(resolveNotableCompany('Warner Bros.')?.id).toBe(174);
			expect(resolveNotableCompany('A24')?.id).toBe(41077);
			expect(resolveNotableCompany('Universal Pictures')?.id).toBe(33);
		});
	});

	describe('2. Suggestion Generation & Active Filter Badges', () => {
		it('generates rich discovery suggestions for year, genre, and combined queries', () => {
			const yearSuggestions = generateDiscoverySuggestions('2024');
			expect(yearSuggestions.some((s) => s.type === 'year' && s.url.includes('year=2024'))).toBe(
				true
			);

			const genreYearSuggestions = generateDiscoverySuggestions('action 2023');
			expect(
				genreYearSuggestions.some(
					(s) => s.type === 'combined' && s.url.includes('genre=28') && s.url.includes('year=2023')
				)
			).toBe(true);

			const titleYearSuggestions = generateDiscoverySuggestions('Dune 2024');
			expect(
				titleYearSuggestions.some(
					(s) =>
						s.type === 'combined' && s.url.includes('query=Dune') && s.url.includes('year=2024')
				)
			).toBe(true);
		});

		it('buildActiveFilterItems creates clean human-readable chips', () => {
			const items = buildActiveFilterItems({
				genre: 28,
				year: 2024,
				minRating: 7.5,
				language: 'ja',
				country: 'JP',
				sortBy: 'vote_average.desc'
			});

			expect(items.find((i) => i.key === 'genre')?.displayValue).toBe('Action');
			expect(items.find((i) => i.key === 'year')?.displayValue).toBe('2024');
			expect(items.find((i) => i.key === 'minRating')?.displayValue).toBe('7.5+ ★');
			expect(items.find((i) => i.key === 'language')?.displayValue).toBe('Japanese');
			expect(items.find((i) => i.key === 'country')?.displayValue).toBe('Japan');
			expect(items.find((i) => i.key === 'sortBy')?.displayValue).toBe('Highest Rated');
		});
	});

	describe('3. TMDB Endpoints & Routing Architecture', () => {
		it('searchPeople queries /search/person and maps results accurately', async () => {
			let capturedUrl = '';
			const mockPeople: TMDBPaginatedResponse<TMDBPersonSearchResult> = {
				page: 1,
				total_pages: 1,
				total_results: 1,
				results: [
					{
						id: 525,
						name: 'Christopher Nolan',
						profile_path: '/c_nolan.jpg',
						known_for_department: 'Directing',
						popularity: 48.5,
						known_for: [
							{
								id: 157336,
								title: 'Interstellar',
								overview: 'A team of explorers travel through a wormhole.',
								poster_path: '/inter.jpg',
								backdrop_path: '/inter_bg.jpg',
								vote_average: 8.4,
								vote_count: 35000
							}
						]
					}
				]
			};

			const customFetch: typeof fetch = (async (input: RequestInfo | URL) => {
				capturedUrl = String(input);
				return new Response(JSON.stringify(mockPeople), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}) as typeof fetch;

			const result = await searchPeople({ query: 'Christopher Nolan' }, customFetch);
			expect(capturedUrl).toContain('/search/person');
			expect(capturedUrl).toContain('query=Christopher+Nolan');
			expect(result.results).toHaveLength(1);

			const mapped = mapTMDBPersonSearchResult(result.results[0]);
			expect(mapped.id).toBe('525');
			expect(mapped.name).toBe('Christopher Nolan');
			expect(mapped.knownForDepartment).toBe('Directing');
			expect(mapped.knownForTitles).toContain('Interstellar');
			expect(mapped.profileUrl).toContain('/c_nolan.jpg');
		});

		it('searchCompanies queries /search/company and maps results accurately', async () => {
			let capturedUrl = '';
			const mockCompanies: TMDBPaginatedResponse<TMDBCompanySearchResult> = {
				page: 1,
				total_pages: 1,
				total_results: 1,
				results: [
					{
						id: 174,
						name: 'Warner Bros. Pictures',
						logo_path: '/warner.png',
						origin_country: 'US'
					}
				]
			};

			const customFetch: typeof fetch = (async (input: RequestInfo | URL) => {
				capturedUrl = String(input);
				return new Response(JSON.stringify(mockCompanies), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}) as typeof fetch;

			const result = await searchCompanies({ query: 'Warner Bros' }, customFetch);
			expect(capturedUrl).toContain('/search/company');
			expect(capturedUrl).toContain('query=Warner+Bros');
			expect(result.results).toHaveLength(1);

			const mapped = mapTMDBCompanySearchResult(result.results[0]);
			expect(mapped.id).toBe('174');
			expect(mapped.name).toBe('Warner Bros. Pictures');
			expect(mapped.originCountry).toBe('US');
			expect(mapped.logoUrl).toContain('/warner.png');
		});

		it('unifiedSearch routes Year-only queries to discoverMovies with primary_release_year', async () => {
			let capturedUrl = '';
			const mockMovies: TMDBPaginatedResponse<TMDBMovie> = {
				page: 1,
				total_pages: 5,
				total_results: 100,
				results: [
					{
						id: 693134,
						title: 'Dune: Part Two',
						overview: 'Paul Atreides unites with Chani and the Fremen.',
						poster_path: '/dune2.jpg',
						backdrop_path: '/dune2_bg.jpg',
						release_date: '2024-03-01',
						vote_average: 8.3,
						vote_count: 5000
					}
				]
			};

			const customFetch: typeof fetch = (async (input: RequestInfo | URL) => {
				capturedUrl = String(input);
				return new Response(JSON.stringify(mockMovies), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}) as typeof fetch;

			const res = await unifiedSearch({ query: '2024' }, customFetch);
			expect(capturedUrl).toContain('/discover/movie');
			expect(capturedUrl).toContain('primary_release_year=2024');
			expect(res.movies).toHaveLength(1);
			expect(res.movies[0].title).toBe('Dune: Part Two');
			expect(res.activeFilters.some((f) => f.key === 'year' && f.value === '2024')).toBe(true);
		});

		it('unifiedSearch routes Title plus Year to searchMovies with primary_release_year', async () => {
			let capturedUrl = '';
			const mockMovies: TMDBPaginatedResponse<TMDBMovie> = {
				page: 1,
				total_pages: 1,
				total_results: 1,
				results: [
					{
						id: 693134,
						title: 'Dune: Part Two',
						overview: 'Paul Atreides unites with Chani.',
						poster_path: '/dune2.jpg',
						backdrop_path: '/dune2_bg.jpg',
						release_date: '2024-03-01',
						vote_average: 8.3,
						vote_count: 5000
					}
				]
			};

			const customFetch: typeof fetch = (async (input: RequestInfo | URL) => {
				capturedUrl = String(input);
				return new Response(JSON.stringify(mockMovies), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}) as typeof fetch;

			const res = await unifiedSearch({ query: 'Dune 2024' }, customFetch);
			expect(capturedUrl).toContain('/search/movie');
			expect(capturedUrl).toContain('query=Dune');
			expect(capturedUrl).toContain('primary_release_year=2024');
			expect(res.movies).toHaveLength(1);
		});

		it('unifiedSearch executes multi-entity search for person queries and distinguishes people from movies', async () => {
			const mockFetchFn = createMockFetch({
				'/search/movie': {
					page: 1,
					total_pages: 0,
					total_results: 0,
					results: []
				},
				'/search/person': {
					page: 1,
					total_pages: 1,
					total_results: 1,
					results: [
						{
							id: 525,
							name: 'Christopher Nolan',
							profile_path: '/nolan.jpg',
							known_for_department: 'Directing',
							popularity: 50.0,
							known_for: []
						}
					]
				},
				'/person/525/movie_credits': {
					id: 525,
					cast: [],
					crew: [
						{
							id: 157336,
							title: 'Interstellar',
							job: 'Director',
							department: 'Directing',
							release_date: '2014-11-05',
							vote_average: 8.4,
							vote_count: 35000
						}
					]
				}
			});

			const res = await unifiedSearch({ query: 'Christopher Nolan' }, mockFetchFn);
			expect(res.people).toHaveLength(1);
			expect(res.people[0].name).toBe('Christopher Nolan');
			expect(res.movies).toHaveLength(1);
			expect(res.movies[0].title).toBe('Interstellar');
			// People and movies are kept in distinct arrays
			expect(res.people[0].id).toBe('525');
			expect(res.movies[0].id).toBe('157336');
		});
	});

	describe('4. Search API Endpoint & Suggestions Response', () => {
		it('returns categorized suggestions when suggest=true is requested', async () => {
			const mockFetchFn = createMockFetch({
				'/search/movie': {
					page: 1,
					total_pages: 1,
					total_results: 1,
					results: [
						{
							id: 157336,
							title: 'Interstellar',
							release_date: '2014-11-05',
							vote_average: 8.4,
							vote_count: 35000,
							poster_path: '/inter.jpg'
						}
					]
				},
				'/search/person': {
					page: 1,
					total_pages: 1,
					total_results: 1,
					results: [
						{
							id: 525,
							name: 'Christopher Nolan',
							profile_path: '/nolan.jpg',
							known_for_department: 'Directing',
							popularity: 50.0,
							known_for: []
						}
					]
				}
			});

			const url = new URL('http://localhost/api/search?suggest=true&query=Inter');
			const response = await getSearchApi({
				url,
				fetch: mockFetchFn
			} as unknown as Parameters<typeof getSearchApi>[0]);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data.movies).toBeDefined();
			expect(data.people).toBeDefined();
			expect(data.discovery).toBeDefined();
			expect(data.movies.length).toBeGreaterThan(0);
			expect(data.movies[0].title).toBe('Interstellar');
		});

		it('loadSearchPage correctly reads query, filters, and returns unified search data', async () => {
			const mockFetchFn = createMockFetch({
				'/discover/movie': {
					page: 1,
					total_pages: 2,
					total_results: 30,
					results: [
						{
							id: 101,
							title: 'Cyberpunk Action',
							release_date: '2023-08-10',
							vote_average: 7.8,
							vote_count: 200,
							poster_path: '/action.jpg',
							genre_ids: [28]
						}
					]
				}
			});

			const url = new URL('http://localhost/search?genre=28&year=2023&minRating=7');
			const res = await loadSearchPage({
				url,
				fetch: mockFetchFn,
				setHeaders: () => {}
			} as unknown as Parameters<typeof loadSearchPage>[0]);

			expect(res.movies).toHaveLength(1);
			expect(res.movies[0].title).toBe('Cyberpunk Action');
			expect(res.filters.genre).toBe('28');
			expect(res.filters.year).toBe(2023);
			expect(res.filters.minRating).toBe(7);
			expect(res.activeFilters.length).toBeGreaterThan(0);
		});
	});
});
