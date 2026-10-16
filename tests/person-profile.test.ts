import { describe, it, expect, beforeEach } from 'bun:test';
import {
	calculateAge,
	formatPersonDate,
	mapTMDBPersonToProfile,
	clearCache,
	TMDBError
} from '../src/lib/server/tmdb';
import { load } from '../src/routes/person/[id]/+page.server';
import type { TMDBPerson, TMDBPersonMovieCredits } from '../src/lib/types/tmdb';

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

describe('Phase 4: Person Profile & Filmography Tests', () => {
	beforeEach(() => {
		clearCache();
	});

	describe('Age Calculation and Date Formatting', () => {
		it('formats ISO date into human-readable US date', () => {
			expect(formatPersonDate('1970-07-30')).toBe('July 30, 1970');
			expect(formatPersonDate('2008-01-22')).toBe('January 22, 2008');
			expect(formatPersonDate('')).toBeUndefined();
			expect(formatPersonDate(null)).toBeUndefined();
			expect(formatPersonDate(undefined)).toBeUndefined();
		});

		it('calculates correct age for living person', () => {
			// Person born 50 years ago from current year
			const currentYear = new Date().getFullYear();
			const birthYear = currentYear - 40;
			const age = calculateAge(`${birthYear}-01-01`);
			expect(age).toBeGreaterThanOrEqual(39);
			expect(age).toBeLessThanOrEqual(41);
		});

		it('calculates exact age at death for deceased person', () => {
			// Heath Ledger: April 4, 1979 - January 22, 2008 -> 28 years old
			const ageAtDeath = calculateAge('1979-04-04', '2008-01-22');
			expect(ageAtDeath).toBe(28);
		});

		it('returns null for missing or invalid dates', () => {
			expect(calculateAge(null)).toBeNull();
			expect(calculateAge('')).toBeNull();
			expect(calculateAge('not-a-date')).toBeNull();
		});
	});

	describe('mapTMDBPersonToProfile Data Transformation', () => {
		const rawPerson: TMDBPerson = {
			id: 525,
			name: 'Christopher Nolan',
			biography:
				'Christopher Edward Nolan is a British-American film director, producer, and screenwriter.',
			birthday: '1970-07-30',
			deathday: null,
			place_of_birth: 'London, England, UK',
			profile_path: '/nolan_portrait.jpg',
			known_for_department: 'Directing',
			imdb_id: 'nm0634240',
			homepage: 'https://syncopy.com'
		};

		const rawCredits: TMDBPersonMovieCredits = {
			id: 525,
			cast: [
				{
					id: 9999,
					title: 'Cameo Feature',
					character: 'Self / Pedestrian',
					release_date: '2010-06-15',
					vote_average: 6.8,
					vote_count: 50,
					poster_path: '/cameo.jpg'
				}
			],
			crew: [
				{
					id: 157336,
					title: 'Interstellar',
					job: 'Director',
					department: 'Directing',
					release_date: '2014-11-05',
					vote_average: 8.4,
					vote_count: 34000,
					poster_path: '/interstellar.jpg'
				},
				{
					id: 157336, // Same movie, writer role -> must NOT be counted as director credit
					title: 'Interstellar',
					job: 'Writer',
					department: 'Writing',
					release_date: '2014-11-05',
					vote_average: 8.4,
					vote_count: 34000,
					poster_path: '/interstellar.jpg'
				},
				{
					id: 27205,
					title: 'Inception',
					job: 'Director',
					department: 'Directing',
					release_date: '2010-07-16',
					vote_average: 8.3,
					vote_count: 35000,
					poster_path: '/inception.jpg'
				},
				{
					id: 872585,
					title: 'Oppenheimer',
					job: 'Director',
					department: 'Directing',
					release_date: '2023-07-21',
					vote_average: 8.1,
					vote_count: 14000,
					poster_path: '/oppenheimer.jpg'
				},
				{
					id: 5000,
					title: 'Produced Feature',
					job: 'Producer', // Producer role -> must NOT be included in directing credits
					department: 'Production',
					release_date: '2021-01-01',
					vote_average: 7.0,
					vote_count: 100,
					poster_path: '/producer.jpg'
				},
				{
					id: 6000,
					title: 'Executive Produced Title',
					job: 'Executive Producer', // Must NOT be in directing credits
					department: 'Production',
					release_date: '2019-01-01',
					vote_average: 7.2,
					vote_count: 200,
					poster_path: null
				}
			]
		};

		it('transforms person details accurately with profile URL and vital stats', () => {
			const profile = mapTMDBPersonToProfile(rawPerson, rawCredits);

			expect(profile.id).toBe('525');
			expect(profile.name).toBe('Christopher Nolan');
			expect(profile.knownForDepartment).toBe('Directing');
			expect(profile.profileUrl).toBe('https://image.tmdb.org/t/p/h632/nolan_portrait.jpg');
			expect(profile.placeOfBirth).toBe('London, England, UK');
			expect(profile.birthdayFormatted).toBe('July 30, 1970');
			expect(profile.deathdayFormatted).toBeUndefined();
			expect(profile.imdbId).toBe('nm0634240');
			expect(profile.homepage).toBe('https://syncopy.com');
		});

		it('strictly filters directing credits to job === "Director", excluding Producer and Writer', () => {
			const profile = mapTMDBPersonToProfile(rawPerson, rawCredits);

			// Directing credits must only contain: Oppenheimer (2023), Interstellar (2014), Inception (2010)
			expect(profile.directingCredits).toHaveLength(3);
			const directingIds = profile.directingCredits.map((c) => c.id);
			expect(directingIds).toContain('872585'); // Oppenheimer
			expect(directingIds).toContain('157336'); // Interstellar
			expect(directingIds).toContain('27205'); // Inception

			// Must not contain Producer or Executive Producer movies
			expect(directingIds).not.toContain('5000');
			expect(directingIds).not.toContain('6000');

			// Every item in directing credits must have job === 'Director'
			for (const credit of profile.directingCredits) {
				expect(credit.job).toBe('Director');
			}
		});

		it('sorts directing credits descending by release date', () => {
			const profile = mapTMDBPersonToProfile(rawPerson, rawCredits);

			expect(profile.directingCredits[0].title).toBe('Oppenheimer'); // 2023
			expect(profile.directingCredits[1].title).toBe('Interstellar'); // 2014
			expect(profile.directingCredits[2].title).toBe('Inception'); // 2010
		});

		it('correctly maps acting credits without mixing crew entries', () => {
			const profile = mapTMDBPersonToProfile(rawPerson, rawCredits);

			expect(profile.actingCredits).toHaveLength(1);
			expect(profile.actingCredits[0].title).toBe('Cameo Feature');
			expect(profile.actingCredits[0].character).toBe('Self / Pedestrian');
		});

		it('allows a movie to appear in both acting and directing when the person performed both roles', () => {
			// Clint Eastwood in Unforgiven
			const multiTalentCredits: TMDBPersonMovieCredits = {
				id: 190,
				cast: [
					{
						id: 33,
						title: 'Unforgiven',
						character: 'Bill Munny',
						release_date: '1992-08-07',
						vote_average: 8.2,
						vote_count: 4000,
						poster_path: '/unforgiven.jpg'
					}
				],
				crew: [
					{
						id: 33,
						title: 'Unforgiven',
						job: 'Director',
						department: 'Directing',
						release_date: '1992-08-07',
						vote_average: 8.2,
						vote_count: 4000,
						poster_path: '/unforgiven.jpg'
					}
				]
			};

			const profile = mapTMDBPersonToProfile(
				{ ...rawPerson, id: 190, name: 'Clint Eastwood' },
				multiTalentCredits
			);

			expect(profile.actingCredits.map((m) => m.id)).toContain('33');
			expect(profile.directingCredits.map((m) => m.id)).toContain('33');
			expect(profile.actingCredits[0].character).toBe('Bill Munny');
			expect(profile.directingCredits[0].job).toBe('Director');
		});

		it('deduplicates movie entries within acting credits and directing credits', () => {
			const duplicateCredits: TMDBPersonMovieCredits = {
				id: 100,
				cast: [
					{
						id: 10,
						title: 'Dual Role Movie',
						character: 'Twin Brother A',
						release_date: '2020-01-01',
						vote_average: 7.0,
						vote_count: 100
					},
					{
						id: 10,
						title: 'Dual Role Movie',
						character: 'Twin Brother B',
						release_date: '2020-01-01',
						vote_average: 7.0,
						vote_count: 100
					}
				],
				crew: [
					{
						id: 20,
						title: 'Co-directed Movie',
						job: 'Director',
						release_date: '2022-01-01',
						vote_average: 7.5,
						vote_count: 200
					},
					{
						id: 20, // duplicate director credit on same movie
						title: 'Co-directed Movie',
						job: 'Director',
						release_date: '2022-01-01',
						vote_average: 7.5,
						vote_count: 200
					}
				]
			};

			const profile = mapTMDBPersonToProfile(rawPerson, duplicateCredits);

			expect(profile.actingCredits).toHaveLength(1);
			expect(profile.actingCredits[0].character).toContain('Twin Brother A');
			expect(profile.actingCredits[0].character).toContain('Twin Brother B');

			expect(profile.directingCredits).toHaveLength(1);
			expect(profile.directingCredits[0].id).toBe('20');
		});

		it('gracefully handles missing credits, missing images, and missing biography', () => {
			const minimalPerson: TMDBPerson = {
				id: 999,
				name: 'Anonymous Creator',
				profile_path: null,
				biography: ''
			};

			const profile = mapTMDBPersonToProfile(minimalPerson, null);

			expect(profile.id).toBe('999');
			expect(profile.name).toBe('Anonymous Creator');
			expect(profile.profileUrl).toBe('');
			expect(profile.biography).toBe('');
			expect(profile.actingCredits).toEqual([]);
			expect(profile.directingCredits).toEqual([]);
			expect(profile.totalCreditsCount).toBe(0);
		});
	});

	describe('Page Server Load Validation and Error Handling', () => {
		it('rejects non-numeric person ID with 404', async () => {
			await expect(
				load({
					params: { id: 'invalid-person' },
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof load>[0])
			).rejects.toThrow();
		});

		it('rejects zero or negative person ID with 404', async () => {
			await expect(
				load({
					params: { id: '0' },
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof load>[0])
			).rejects.toThrow();

			await expect(
				load({
					params: { id: '-10' },
					fetch: mockFetch({}),
					setHeaders: () => {}
				} as unknown as Parameters<typeof load>[0])
			).rejects.toThrow();
		});

		it('handles TMDB 404 person not found with 404 error', async () => {
			const fetchFn = mockFetch({
				'/person/999999': new TMDBError('Person not found', 404)
			});

			await expect(
				load({
					params: { id: '999999' },
					fetch: fetchFn,
					setHeaders: () => {}
				} as unknown as Parameters<typeof load>[0])
			).rejects.toThrow();
		});

		it('handles partial API failure when credits fail but person details succeed', async () => {
			const mockPerson: TMDBPerson = {
				id: 300,
				name: 'Resilient Artist',
				biography: 'Performs consistently under partial outages.',
				birthday: '1980-05-15'
			};

			const fetchFn = mockFetch({
				'/person/300/movie_credits': new TMDBError('Credits database timeout', 504),
				'/person/300': mockPerson
			});

			const result = await load({
				params: { id: '300' },
				fetch: fetchFn,
				setHeaders: () => {}
			} as unknown as Parameters<typeof load>[0]);

			expect(result.person.name).toBe('Resilient Artist');
			expect(result.person.actingCredits).toEqual([]);
			expect(result.person.directingCredits).toEqual([]);
			expect(result.creditsError).toContain('could not be retrieved');
		});

		it('loads complete person profile and filmography successfully', async () => {
			const mockPerson: TMDBPerson = {
				id: 525,
				name: 'Christopher Nolan',
				known_for_department: 'Directing'
			};

			const mockCredits: TMDBPersonMovieCredits = {
				id: 525,
				cast: [],
				crew: [
					{
						id: 157336,
						title: 'Interstellar',
						job: 'Director',
						release_date: '2014-11-05',
						vote_average: 8.4,
						vote_count: 34000
					}
				]
			};

			const fetchFn = mockFetch({
				'/person/525/movie_credits': mockCredits,
				'/person/525': mockPerson
			});

			const result = await load({
				params: { id: '525' },
				fetch: fetchFn,
				setHeaders: () => {}
			} as unknown as Parameters<typeof load>[0]);

			expect(result.person.name).toBe('Christopher Nolan');
			expect(result.person.directingCredits).toHaveLength(1);
			expect(result.person.directingCredits[0].title).toBe('Interstellar');
			expect(result.person.directingCredits[0].id).toBe('157336');
			expect(result.creditsError).toBeNull();
		});
	});
});
