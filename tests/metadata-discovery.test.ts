import { describe, it, expect, beforeEach } from 'bun:test';
import {
	getCompanyDetails,
	formatCountryName,
	discoverMovies,
	mapTMDBMovieDetailsToDetail,
	mapTMDBPersonToProfile,
	clearCache,
	TMDBError
} from '../src/lib/server/tmdb';
import { load as loadCompany } from '../src/routes/company/[id]/+page.server';
import { load as loadCountry } from '../src/routes/country/[code]/+page.server';
import { load as loadLanguage } from '../src/routes/language/[code]/+page.server';
import type {
	TMDBMovieDetails,
	TMDBCreditsResponse,
	TMDBPerson,
	TMDBPersonMovieCredits,
	TMDBCompanyDetails,
	TMDBPaginatedResponse,
	TMDBMovie
} from '../src/lib/types/tmdb';

function mockFetch(routes: Record<string, unknown>): typeof fetch {
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

		return new Response(JSON.stringify({ status_message: 'Not found in mock' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' }
		});
	}) as typeof fetch;
}

describe('Additional Requirement: Linked Metadata & Discovery Navigation', () => {
	beforeEach(() => {
		clearCache();
	});

	describe('Formatters and Utility Functions', () => {
		it('formatCountryName transforms ISO 3166-1 alpha-2 codes into human readable English country names', () => {
			expect(formatCountryName('US')).toBe('United States');
			expect(formatCountryName('GB')).toBe('United Kingdom');
			expect(formatCountryName('FR')).toBe('France');
			expect(formatCountryName('JP')).toBe('Japan');
			expect(formatCountryName('KR')).toBe('South Korea');
			expect(formatCountryName('DE')).toBe('Germany');
			expect(formatCountryName('it')).toBe('Italy'); // Case insensitive
			expect(formatCountryName(undefined)).toBeUndefined();
			expect(formatCountryName('')).toBeUndefined();
			expect(formatCountryName(null)).toBeUndefined();
		});

		it('discoverMovies correctly appends with_companies, with_origin_country, and with_original_language', async () => {
			let capturedUrl = '';
			const customFetch: typeof fetch = (async (input: RequestInfo | URL) => {
				capturedUrl = typeof input === 'string' ? input : input.toString();
				const emptyPage: TMDBPaginatedResponse<TMDBMovie> = {
					page: 1,
					results: [],
					total_pages: 0,
					total_results: 0
				};
				return new Response(JSON.stringify(emptyPage), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}) as typeof fetch;

			await discoverMovies(
				{
					with_companies: 9298,
					with_origin_country: 'GB',
					with_original_language: 'en',
					page: 2
				},
				customFetch
			);

			expect(capturedUrl).toContain('/discover/movie');
			expect(capturedUrl).toContain('with_companies=9298');
			expect(capturedUrl).toContain('with_origin_country=GB');
			expect(capturedUrl).toContain('with_original_language=en');
			expect(capturedUrl).toContain('page=2');
		});

		it('getCompanyDetails queries /company/{id} endpoint', async () => {
			let capturedUrl = '';
			const mockCompany: TMDBCompanyDetails = {
				id: 420,
				name: 'Marvel Studios',
				headquarters: 'Burbank, California',
				origin_country: 'US'
			};
			const customFetch: typeof fetch = (async (input: RequestInfo | URL) => {
				capturedUrl = typeof input === 'string' ? input : input.toString();
				return new Response(JSON.stringify(mockCompany), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}) as typeof fetch;

			const result = await getCompanyDetails(420, customFetch);
			expect(capturedUrl).toContain('/company/420');
			expect(result.name).toBe('Marvel Studios');
		});
	});

	describe('Role Classification and Filmography Categorization', () => {
		const rawPerson: TMDBPerson = {
			id: 1234,
			name: 'Multi-Hyphenate Auteur',
			biography: 'Directs, writes, produces, photographs, and acts.',
			known_for_department: 'Directing'
		};

		const rawCredits: TMDBPersonMovieCredits = {
			id: 1234,
			cast: [
				{
					id: 101,
					title: 'Acting Masterpiece',
					character: 'Hero Lead',
					release_date: '2022-05-01',
					vote_average: 8.2,
					vote_count: 500
				}
			],
			crew: [
				{
					id: 102,
					title: 'Directorial Vision',
					job: 'Director',
					department: 'Directing',
					release_date: '2023-01-01',
					vote_average: 8.5,
					vote_count: 1000
				},
				{
					id: 103,
					title: 'Written Classic',
					job: 'Screenplay',
					department: 'Writing',
					release_date: '2021-06-01',
					vote_average: 7.9,
					vote_count: 300
				},
				{
					id: 103,
					title: 'Written Classic',
					job: 'Story',
					department: 'Writing',
					release_date: '2021-06-01',
					vote_average: 7.9,
					vote_count: 300
				},
				{
					id: 104,
					title: 'Produced Hit',
					job: 'Producer',
					department: 'Production',
					release_date: '2020-03-01',
					vote_average: 7.5,
					vote_count: 400
				},
				{
					id: 105,
					title: 'Visual Splendor',
					job: 'Director of Photography',
					department: 'Camera',
					release_date: '2019-11-01',
					vote_average: 8.0,
					vote_count: 600
				},
				{
					id: 106,
					title: 'Symphonic Odyssey',
					job: 'Original Music Composer',
					department: 'Sound',
					release_date: '2018-09-01',
					vote_average: 7.8,
					vote_count: 250
				},
				{
					id: 102, // Also produced the movie they directed
					title: 'Directorial Vision',
					job: 'Producer',
					department: 'Production',
					release_date: '2023-01-01',
					vote_average: 8.5,
					vote_count: 1000
				}
			]
		};

		it('accurately distributes credits into discrete, role-aware categories', () => {
			const profile = mapTMDBPersonToProfile(rawPerson, rawCredits);

			// Acting credits
			expect(profile.actingCredits).toHaveLength(1);
			expect(profile.actingCredits[0].title).toBe('Acting Masterpiece');
			expect(profile.actingCredits[0].character).toBe('Hero Lead');

			// Directing credits: strictly Director
			expect(profile.directingCredits).toHaveLength(1);
			expect(profile.directingCredits[0].title).toBe('Directorial Vision');
			expect(profile.directingCredits[0].job).toBe('Director');

			// Writing credits: Screenplay & Story
			expect(profile.writingCredits).toHaveLength(1);
			expect(profile.writingCredits[0].title).toBe('Written Classic');
			expect(profile.writingCredits[0].job).toContain('Screenplay');
			expect(profile.writingCredits[0].job).toContain('Story');

			// Producing credits
			expect(profile.producingCredits).toHaveLength(2);
			const prodTitles = profile.producingCredits.map((m) => m.title);
			expect(prodTitles).toContain('Produced Hit');
			expect(prodTitles).toContain('Directorial Vision');

			// Cinematography credits
			expect(profile.cinematographyCredits).toHaveLength(1);
			expect(profile.cinematographyCredits[0].title).toBe('Visual Splendor');
			expect(profile.cinematographyCredits[0].job).toBe('Director of Photography');

			// Other crew credits (Music Composer)
			expect(profile.otherCrewCredits).toHaveLength(1);
			expect(profile.otherCrewCredits[0].title).toBe('Symphonic Odyssey');
			expect(profile.otherCrewCredits[0].job).toBe('Original Music Composer');

			// Unique movies count across all roles: 101, 102, 103, 104, 105, 106 = 6
			expect(profile.totalCreditsCount).toBe(6);
		});

		it('preserves multi-category presence when a creator genuinely performed multiple distinct roles', () => {
			const profile = mapTMDBPersonToProfile(rawPerson, rawCredits);

			// Directorial Vision (id: 102) was directed AND produced
			expect(profile.directingCredits.some((c) => c.id === '102')).toBe(true);
			expect(profile.producingCredits.some((c) => c.id === '102')).toBe(true);
		});
	});

	describe('Movie Detail Linked Metadata Mapping', () => {
		const rawMovieDetails: TMDBMovieDetails = {
			id: 550,
			title: 'Fight Club',
			overview: 'An insomniac office worker and a devil-may-care soap maker.',
			release_date: '1999-10-15',
			vote_average: 8.433,
			vote_count: 26000,
			poster_path: '/fight_club_poster.jpg',
			backdrop_path: '/fight_club_bg.jpg',
			original_language: 'en',
			genres: [
				{ id: 18, name: 'Drama' },
				{ id: 53, name: 'Thriller' }
			],
			production_companies: [
				{ id: 508, name: 'Regency Enterprises', logo_path: '/regency.png', origin_country: 'US' },
				{ id: 711, name: 'Fox 2000 Pictures', logo_path: '/fox.png', origin_country: 'US' }
			],
			production_countries: [
				{ iso_3166_1: 'US', name: 'United States of America' },
				{ iso_3166_1: 'DE', name: 'Germany' }
			],
			spoken_languages: [{ iso_639_1: 'en', name: 'English', english_name: 'English' }]
		};

		const rawCredits: TMDBCreditsResponse = {
			id: 550,
			cast: [
				{
					id: 287,
					name: 'Brad Pitt',
					character: 'Tyler Durden',
					profile_path: '/brad.jpg',
					order: 0
				},
				{
					id: 819,
					name: 'Edward Norton',
					character: 'The Narrator',
					profile_path: '/edward.jpg',
					order: 1
				}
			],
			crew: [
				{
					id: 7467,
					name: 'David Fincher',
					job: 'Director',
					department: 'Directing',
					profile_path: '/fincher.jpg'
				},
				{
					id: 7468,
					name: 'Jim Uhls',
					job: 'Screenplay',
					department: 'Writing',
					profile_path: '/uhls.jpg'
				},
				{
					id: 7469,
					name: 'Chuck Palahniuk',
					job: 'Novel',
					department: 'Writing',
					profile_path: null
				},
				{
					id: 1254,
					name: 'Art Linson',
					job: 'Producer',
					department: 'Production',
					profile_path: '/linson.jpg'
				},
				{
					id: 7470,
					name: 'Jeff Cronenweth',
					job: 'Director of Photography',
					department: 'Camera',
					profile_path: '/cronenweth.jpg'
				},
				{
					id: 7471,
					name: 'The Dust Brothers',
					job: 'Original Music Composer',
					department: 'Sound',
					profile_path: null
				},
				{
					id: 7472,
					name: 'James Haygood',
					job: 'Editor',
					department: 'Editing',
					profile_path: null
				},
				{
					id: 7473,
					name: 'Alex McDowell',
					job: 'Production Design',
					department: 'Art',
					profile_path: null
				},
				{
					id: 7474,
					name: 'Michael Kaplan',
					job: 'Costume Design',
					department: 'Costume & Make-Up',
					profile_path: null
				}
			]
		};

		it('populates structured production companies with valid TMDB IDs for clickable navigation', () => {
			const detail = mapTMDBMovieDetailsToDetail(rawMovieDetails, rawCredits, []);

			expect(detail.productionCompaniesList).toBeDefined();
			expect(detail.productionCompaniesList).toHaveLength(2);
			expect(detail.productionCompaniesList![0].id).toBe(508);
			expect(detail.productionCompaniesList![0].name).toBe('Regency Enterprises');
			expect(detail.productionCompaniesList![0].logoUrl).toContain('regency.png');
			expect(detail.productionCompaniesList![1].id).toBe(711);
			expect(detail.productionCompaniesList![1].name).toBe('Fox 2000 Pictures');
		});

		it('populates structured production countries with ISO 3166-1 codes', () => {
			const detail = mapTMDBMovieDetailsToDetail(rawMovieDetails, rawCredits, []);

			expect(detail.productionCountriesList).toBeDefined();
			expect(detail.productionCountriesList).toHaveLength(2);
			expect(detail.productionCountriesList![0].iso_3166_1).toBe('US');
			expect(detail.productionCountriesList![0].name).toBe('United States of America');
			expect(detail.productionCountriesList![1].iso_3166_1).toBe('DE');
			expect(detail.productionCountriesList![1].name).toBe('Germany');
		});

		it('populates structured original language code and spoken languages list', () => {
			const detail = mapTMDBMovieDetailsToDetail(rawMovieDetails, rawCredits, []);

			expect(detail.originalLanguageCode).toBe('en');
			expect(detail.originalLanguage).toBe('English');
			expect(detail.spokenLanguagesList).toHaveLength(1);
			expect(detail.spokenLanguagesList![0].iso_639_1).toBe('en');
			expect(detail.spokenLanguagesList![0].name).toBe('English');
		});

		it('populates structured keyCrew members with IDs and names for all filmmaking roles', () => {
			const detail = mapTMDBMovieDetailsToDetail(rawMovieDetails, rawCredits, []);

			// Directors list with ID
			expect(detail.keyCrew.directorsList).toBeDefined();
			expect(detail.keyCrew.directorsList![0].id).toBe(7467);
			expect(detail.keyCrew.directorsList![0].name).toBe('David Fincher');

			// Screenplay / Writers with ID
			expect(detail.keyCrew.screenplayList).toBeDefined();
			const writerIds = detail.keyCrew.screenplayList!.map((w) => w.id);
			expect(writerIds).toContain(7468); // Jim Uhls
			expect(writerIds).toContain(7469); // Chuck Palahniuk

			// Producers with ID
			expect(detail.keyCrew.producersList).toBeDefined();
			expect(detail.keyCrew.producersList![0].id).toBe(1254);
			expect(detail.keyCrew.producersList![0].name).toBe('Art Linson');

			// Cinematography with ID
			expect(detail.keyCrew.cinematographyList).toBeDefined();
			expect(detail.keyCrew.cinematographyList![0].id).toBe(7470);
			expect(detail.keyCrew.cinematographyList![0].name).toBe('Jeff Cronenweth');

			// Composers with ID
			expect(detail.keyCrew.composersList).toBeDefined();
			expect(detail.keyCrew.composersList![0].id).toBe(7471);
			expect(detail.keyCrew.composersList![0].name).toBe('The Dust Brothers');

			// Editors with ID
			expect(detail.keyCrew.editorsList).toBeDefined();
			expect(detail.keyCrew.editorsList![0].id).toBe(7472);
			expect(detail.keyCrew.editorsList![0].name).toBe('James Haygood');

			// Production Design with ID
			expect(detail.keyCrew.productionDesignList).toBeDefined();
			expect(detail.keyCrew.productionDesignList![0].id).toBe(7473);

			// Costume Design with ID
			expect(detail.keyCrew.costumeDesignList).toBeDefined();
			expect(detail.keyCrew.costumeDesignList![0].id).toBe(7474);
		});

		it('populates full crew directory with valid person IDs and roles', () => {
			const detail = mapTMDBMovieDetailsToDetail(rawMovieDetails, rawCredits, []);

			expect(detail.crew.length).toBe(9);
			for (const member of detail.crew) {
				expect(typeof member.id).toBe('number');
				expect(member.id).toBeGreaterThan(0);
				expect(member.name).toBeTruthy();
				expect(member.job).toBeTruthy();
			}
		});
	});

	describe('Company Route Server Load (/company/[id])', () => {
		const mockCompany: TMDBCompanyDetails = {
			id: 9298,
			name: 'Syncopy',
			description:
				'British-American production company founded by Emma Thomas and Christopher Nolan.',
			headquarters: 'London, England',
			homepage: 'https://syncopy.com',
			origin_country: 'GB',
			logo_path: '/syncopy_logo.png'
		};

		const mockCompanyMovies: TMDBPaginatedResponse<TMDBMovie> = {
			page: 1,
			total_pages: 2,
			total_results: 15,
			results: [
				{
					id: 157336,
					title: 'Interstellar',
					overview: 'A team of explorers travel through a wormhole in space.',
					poster_path: '/interstellar.jpg',
					backdrop_path: '/interstellar_bg.jpg',
					release_date: '2014-11-05',
					vote_average: 8.4,
					vote_count: 34000
				}
			]
		};

		it('rejects invalid or non-numeric company IDs with 404', async () => {
			await expect(
				loadCompany({
					params: { id: 'invalid-id' },
					url: new URL('http://localhost/company/invalid-id'),
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof loadCompany>[0])
			).rejects.toThrow();

			await expect(
				loadCompany({
					params: { id: '0' },
					url: new URL('http://localhost/company/0'),
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof loadCompany>[0])
			).rejects.toThrow();

			await expect(
				loadCompany({
					params: { id: '-50' },
					url: new URL('http://localhost/company/-50'),
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof loadCompany>[0])
			).rejects.toThrow();
		});

		it('handles TMDB 404 response for unknown company with 404 error', async () => {
			const fetchFn = mockFetch({
				'/company/999999': new TMDBError('Company not found', 404)
			});

			await expect(
				loadCompany({
					params: { id: '999999' },
					url: new URL('http://localhost/company/999999'),
					fetch: fetchFn,
					setHeaders: () => {}
				} as unknown as Parameters<typeof loadCompany>[0])
			).rejects.toThrow();
		});

		it('loads company profile and associated movies with pagination bounds', async () => {
			const fetchFn = mockFetch({
				'/company/9298': mockCompany,
				'/discover/movie': mockCompanyMovies
			});

			const result = await loadCompany({
				params: { id: '9298' },
				url: new URL('http://localhost/company/9298?page=1'),
				fetch: fetchFn,
				setHeaders: () => {}
			} as unknown as Parameters<typeof loadCompany>[0]);

			expect(result.company.id).toBe(9298);
			expect(result.company.name).toBe('Syncopy');
			expect(result.company.headquarters).toBe('London, England');
			expect(result.company.originCountry).toBe('GB');
			expect(result.company.homepage).toBe('https://syncopy.com');
			expect(result.movies).toHaveLength(1);
			expect(result.movies[0].title).toBe('Interstellar');
			expect(result.totalPages).toBe(2);
			expect(result.totalResults).toBe(15);
			expect(result.currentPage).toBe(1);
			expect(result.moviesError).toBeNull();
		});

		it('handles partial failure gracefully when associated movies endpoint fails', async () => {
			const fetchFn = mockFetch({
				'/company/9298': mockCompany,
				'/discover/movie': new TMDBError('Discover service unavailable', 503)
			});

			const result = await loadCompany({
				params: { id: '9298' },
				url: new URL('http://localhost/company/9298'),
				fetch: fetchFn,
				setHeaders: () => {}
			} as unknown as Parameters<typeof loadCompany>[0]);

			expect(result.company.name).toBe('Syncopy');
			expect(result.movies).toEqual([]);
			expect(result.moviesError).toContain('could not be retrieved');
		});
	});

	describe('Country Route Server Load (/country/[code])', () => {
		const mockCountryMovies: TMDBPaginatedResponse<TMDBMovie> = {
			page: 1,
			total_pages: 5,
			total_results: 100,
			results: [
				{
					id: 4935,
					title: "Howl's Moving Castle",
					overview: 'A young woman is cursed with an old body by a spiteful witch.',
					poster_path: '/howl.jpg',
					backdrop_path: '/howl_bg.jpg',
					release_date: '2004-11-20',
					vote_average: 8.4,
					vote_count: 9000
				}
			]
		};

		it('rejects invalid country codes with 404', async () => {
			await expect(
				loadCountry({
					params: { code: 'USA' }, // 3 letters (invalid ISO 3166-1 alpha-2)
					url: new URL('http://localhost/country/USA'),
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof loadCountry>[0])
			).rejects.toThrow();

			await expect(
				loadCountry({
					params: { code: '12' }, // digits
					url: new URL('http://localhost/country/12'),
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof loadCountry>[0])
			).rejects.toThrow();

			await expect(
				loadCountry({
					params: { code: '' },
					url: new URL('http://localhost/country/'),
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof loadCountry>[0])
			).rejects.toThrow();
		});

		it('normalizes lowercase code to uppercase and resolves country name', async () => {
			let calledUrl = '';
			const fetchFn: typeof fetch = (async (input: RequestInfo | URL) => {
				calledUrl = typeof input === 'string' ? input : input.toString();
				return new Response(JSON.stringify(mockCountryMovies), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}) as typeof fetch;

			const result = await loadCountry({
				params: { code: 'jp' },
				url: new URL('http://localhost/country/jp'),
				fetch: fetchFn,
				setHeaders: () => {}
			} as unknown as Parameters<typeof loadCountry>[0]);

			expect(result.countryCode).toBe('JP');
			expect(result.countryName).toBe('Japan');
			expect(calledUrl).toContain('with_origin_country=JP');
			expect(result.movies).toHaveLength(1);
			expect(result.movies[0].title).toBe("Howl's Moving Castle");
			expect(result.error).toBeNull();
		});

		it('handles empty results and API errors gracefully', async () => {
			const fetchFn = mockFetch({
				'/discover/movie': new TMDBError('Network timeout', 504)
			});

			const result = await loadCountry({
				params: { code: 'FR' },
				url: new URL('http://localhost/country/FR'),
				fetch: fetchFn,
				setHeaders: () => {}
			} as unknown as Parameters<typeof loadCountry>[0]);

			expect(result.countryCode).toBe('FR');
			expect(result.countryName).toBe('France');
			expect(result.movies).toEqual([]);
			expect(result.error).toContain('Unable to retrieve');
		});
	});

	describe('Language Route Server Load (/language/[code])', () => {
		const mockLanguageMovies: TMDBPaginatedResponse<TMDBMovie> = {
			page: 1,
			total_pages: 10,
			total_results: 200,
			results: [
				{
					id: 496243,
					title: 'Parasite',
					overview: "All unemployed, Ki-taek's family takes peculiar interest in the parks.",
					poster_path: '/parasite.jpg',
					backdrop_path: '/parasite_bg.jpg',
					release_date: '2019-05-30',
					vote_average: 8.5,
					vote_count: 17000
				}
			]
		};

		it('rejects invalid language codes with 404', async () => {
			await expect(
				loadLanguage({
					params: { code: 'eng' }, // 3 letters (invalid ISO 639-1)
					url: new URL('http://localhost/language/eng'),
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof loadLanguage>[0])
			).rejects.toThrow();

			await expect(
				loadLanguage({
					params: { code: '99' },
					url: new URL('http://localhost/language/99'),
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof loadLanguage>[0])
			).rejects.toThrow();
		});

		it('normalizes uppercase code to lowercase and resolves human readable language name', async () => {
			let calledUrl = '';
			const fetchFn: typeof fetch = (async (input: RequestInfo | URL) => {
				calledUrl = typeof input === 'string' ? input : input.toString();
				return new Response(JSON.stringify(mockLanguageMovies), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}) as typeof fetch;

			const result = await loadLanguage({
				params: { code: 'KO' },
				url: new URL('http://localhost/language/KO'),
				fetch: fetchFn,
				setHeaders: () => {}
			} as unknown as Parameters<typeof loadLanguage>[0]);

			expect(result.langCode).toBe('ko');
			expect(result.languageName).toBe('Korean');
			expect(calledUrl).toContain('with_original_language=ko');
			expect(result.movies).toHaveLength(1);
			expect(result.movies[0].title).toBe('Parasite');
			expect(result.error).toBeNull();
		});

		it('handles empty results and API errors gracefully', async () => {
			const fetchFn = mockFetch({
				'/discover/movie': new TMDBError('Network error', 500)
			});

			const result = await loadLanguage({
				params: { code: 'es' },
				url: new URL('http://localhost/language/es'),
				fetch: fetchFn,
				setHeaders: () => {}
			} as unknown as Parameters<typeof loadLanguage>[0]);

			expect(result.langCode).toBe('es');
			expect(result.languageName).toBe('Spanish');
			expect(result.movies).toEqual([]);
			expect(result.error).toContain('Unable to retrieve');
		});
	});
});
