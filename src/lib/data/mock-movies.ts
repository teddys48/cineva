import type { Movie, Genre } from '#lib/types/movie';

export const GENRES: Genre[] = [
	{
		id: 878,
		name: 'Sci-Fi',
		slug: 'sci-fi',
		description: 'Speculative worlds, cosmic frontiers, and artificial consciousness.',
		movieCount: 42
	},
	{
		id: 18,
		name: 'Drama',
		slug: 'drama',
		description: 'Character-driven stories exploring human nature and emotional depth.',
		movieCount: 78
	},
	{
		id: 53,
		name: 'Thriller',
		slug: 'thriller',
		description: 'Suspenseful narratives filled with psychological tension and stakes.',
		movieCount: 54
	},
	{
		id: 28,
		name: 'Action',
		slug: 'action',
		description: 'High-octane pacing, visceral choreography, and relentless momentum.',
		movieCount: 65
	},
	{
		id: 16,
		name: 'Animation',
		slug: 'animation',
		description: 'Imaginative visual craft pushing the boundaries of moving art.',
		movieCount: 38
	},
	{
		id: 10749,
		name: 'Romance',
		slug: 'romance',
		description: 'Intimate explorations of love, longing, and human connection.',
		movieCount: 46
	}
];

export const MOCK_MOVIES: Movie[] = [
	{
		id: 'solaris-ascendant',
		title: 'Solaris Ascendant',
		tagline: 'At the edge of known space, memory becomes the final frontier.',
		overview:
			'A lone archivist adrift at the edge of known space uncovers memories from an empire lost to time.',
		releaseYear: 2025,
		rating: 8.8,
		voteCount: 3420,
		genres: ['Sci-Fi', 'Drama'],
		posterUrl: '#lib/posters/solaris-ascendant.svg',
		backdropUrl: '#lib/backdrops/solaris-ascendant.svg',
		director: 'Elena Rostova',
		runtime: '2h 24m',
		contentRating: 'PG-13',
		featured: true
	},
	{
		id: 'midnight-in-kyoto',
		title: 'Midnight in Kyoto',
		tagline: 'Rain washes the streets, but secrets stay buried.',
		overview:
			'A retired detective is pulled into a clandestine world of rare book counterfeiters across rain-slicked alleys.',
		releaseYear: 2024,
		rating: 8.4,
		voteCount: 1980,
		genres: ['Thriller', 'Drama'],
		posterUrl: '#lib/posters/midnight-in-kyoto.svg',
		backdropUrl: '#lib/backdrops/midnight-in-kyoto.svg',
		director: 'Kenji Takahashi',
		runtime: '1h 56m',
		contentRating: 'R'
	},
	{
		id: 'neon-drifter',
		title: 'Neon Drifter',
		tagline: 'Velocity is the only honest currency left.',
		overview:
			'A courier carrying an experimental biological drive races against corporate syndicates through subterranean expressways.',
		releaseYear: 2024,
		rating: 7.9,
		voteCount: 2450,
		genres: ['Action', 'Sci-Fi'],
		posterUrl: '#lib/posters/neon-drifter.svg',
		backdropUrl: '#lib/backdrops/neon-drifter.svg',
		director: 'Marcus Vance',
		runtime: '1h 48m',
		contentRating: 'R'
	},
	{
		id: 'the-glass-monolith',
		title: 'The Glass Monolith',
		tagline: 'Geometry can hold ancient echoes.',
		overview:
			'Architects investigating an anomalous tower in the Arctic desert discover structures that respond to harmonic frequencies.',
		releaseYear: 2023,
		rating: 8.6,
		voteCount: 4120,
		genres: ['Sci-Fi', 'Mystery'],
		posterUrl: '#lib/posters/the-glass-monolith.svg',
		backdropUrl: '#lib/backdrops/the-glass-monolith.svg',
		director: 'Astrid Lindholm',
		runtime: '2h 12m',
		contentRating: 'PG-13'
	},
	{
		id: 'silent-tides',
		title: 'Silent Tides',
		tagline: 'Listening to the heartbeat of the deep trench.',
		overview:
			'An oceanic expedition documents bioluminescent organisms that communicate through synchronized thermal waves.',
		releaseYear: 2024,
		rating: 8.2,
		voteCount: 1650,
		genres: ['Drama', 'Sci-Fi'],
		posterUrl: '#lib/posters/silent-tides.svg',
		backdropUrl: '#lib/backdrops/silent-tides.svg',
		director: 'Mateo Morales',
		runtime: '1h 44m',
		contentRating: 'PG'
	},
	{
		id: 'echoes-of-autumn',
		title: 'Echoes of Autumn',
		tagline: 'Some melodies take a lifetime to complete.',
		overview:
			'Two estranged pianists reunite in Vienna to reconstruct an unfinished sonata discovered in a monastery vault.',
		releaseYear: 2023,
		rating: 8.1,
		voteCount: 1890,
		genres: ['Drama', 'Romance'],
		posterUrl: '#lib/posters/echoes-of-autumn.svg',
		backdropUrl: '#lib/backdrops/echoes-of-autumn.svg',
		director: 'Clara Delacroix',
		runtime: '2h 05m',
		contentRating: 'PG-13'
	},
	{
		id: 'shadow-protocol',
		title: 'Shadow Protocol',
		tagline: 'Trust nothing that carries a digital signature.',
		overview:
			'A cybersecurity operative discovers an autonomous satellite network executing unassigned surveillance sweeps.',
		releaseYear: 2025,
		rating: 8.5,
		voteCount: 2780,
		genres: ['Thriller', 'Action'],
		posterUrl: '#lib/posters/shadow-protocol.svg',
		backdropUrl: '#lib/backdrops/shadow-protocol.svg',
		director: 'David Thorne',
		runtime: '2h 08m',
		contentRating: 'PG-13'
	},
	{
		id: 'the-clockmaker-daughter',
		title: "The Clockmaker's Daughter",
		tagline: 'Every cog has a secret purpose.',
		overview:
			'In an intricate steampunk metropolis, a young apprentice uncovers an ornate clock that can manipulate personal memory.',
		releaseYear: 2024,
		rating: 8.7,
		voteCount: 3100,
		genres: ['Animation', 'Sci-Fi'],
		posterUrl: '#lib/posters/the-clockmaker-daughter.svg',
		backdropUrl: '#lib/backdrops/the-clockmaker-daughter.svg',
		director: 'Sophie Laurent',
		runtime: '1h 38m',
		contentRating: 'PG'
	},
	{
		id: 'crimson-horizon',
		title: 'Crimson Horizon',
		tagline: 'The dust settles, but retribution does not.',
		overview:
			'A frontier marshal tracks a band of outlaws across arid badlands where a solar flare has knocked out all communications.',
		releaseYear: 2026,
		rating: 7.8,
		voteCount: 920,
		genres: ['Action', 'Thriller'],
		posterUrl: '#lib/posters/crimson-horizon.svg',
		backdropUrl: '#lib/backdrops/crimson-horizon.svg',
		director: 'Caleb Walker',
		runtime: '2h 01m',
		contentRating: 'R',
		isUpcoming: true,
		releaseDateText: 'November 2026'
	},
	{
		id: 'the-last-odyssey',
		title: 'The Last Odyssey',
		tagline: 'Beyond the horizon lies the origin.',
		overview:
			'A deep-space surveyor crew embarks on an irreversible expedition past the Oort cloud toward an unidentified signal.',
		releaseYear: 2026,
		rating: 8.3,
		voteCount: 750,
		genres: ['Sci-Fi', 'Action'],
		posterUrl: '#lib/posters/the-last-odyssey.svg',
		backdropUrl: '#lib/backdrops/the-last-odyssey.svg',
		director: 'Hiroshi Sato',
		runtime: '2h 30m',
		contentRating: 'PG-13',
		isUpcoming: true,
		releaseDateText: 'December 2026'
	},
	{
		id: 'whispering-pines',
		title: 'Whispering Pines',
		tagline: 'The forest holds every promise ever spoken.',
		overview:
			'A sound designer working in an isolated mountain cabin begins recording anomalous low frequency vocalizations in the wind.',
		releaseYear: 2026,
		rating: 7.7,
		voteCount: 610,
		genres: ['Thriller', 'Drama'],
		posterUrl: '#lib/posters/whispering-pines.svg',
		backdropUrl: '#lib/backdrops/whispering-pines.svg',
		director: 'Nora Aris',
		runtime: '1h 52m',
		contentRating: 'R',
		isUpcoming: true,
		releaseDateText: 'January 2027'
	},
	{
		id: 'prism-of-memory',
		title: 'Prism of Memory',
		tagline: 'Colors we cannot forget.',
		overview:
			'A retired archivist uses restored 16mm footage to piece together a vanished art collective in 1970s Berlin.',
		releaseYear: 2024,
		rating: 8.0,
		voteCount: 1420,
		genres: ['Drama'],
		posterUrl: '#lib/posters/prism-of-memory.svg',
		backdropUrl: '#lib/backdrops/prism-of-memory.svg',
		director: 'Julian Kestler',
		runtime: '1h 47m',
		contentRating: 'PG-13'
	}
];

export const FEATURED_MOVIE = MOCK_MOVIES[0];

export const TRENDING_MOVIES = [
	MOCK_MOVIES[0],
	MOCK_MOVIES[1],
	MOCK_MOVIES[2],
	MOCK_MOVIES[3],
	MOCK_MOVIES[4],
	MOCK_MOVIES[5]
];

export const POPULAR_MOVIES = [
	MOCK_MOVIES[3],
	MOCK_MOVIES[7],
	MOCK_MOVIES[6],
	MOCK_MOVIES[1],
	MOCK_MOVIES[11]
];

export const UPCOMING_MOVIES = [MOCK_MOVIES[8], MOCK_MOVIES[9], MOCK_MOVIES[10]];
