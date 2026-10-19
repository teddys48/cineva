<script lang="ts">
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import HeroMovie from '#lib/components/movie/HeroMovie.svelte';
	import MovieRow from '#lib/components/movie/MovieRow.svelte';
	import MovieGrid from '#lib/components/movie/MovieGrid.svelte';
	import GenreTile from '#lib/components/movie/GenreTile.svelte';
	import SectionError from '#lib/components/ui/SectionError.svelte';
	import { GENRES } from '#lib/data/mock-movies';
	import { watchlistState } from '#lib/watchlist.svelte';
	import { personalizationState } from '#lib/personalization.svelte';
	import { ArrowRight, Film } from 'lucide-svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let recentlyViewed = $derived(personalizationState.recentlyViewedMovies);
	let watchlistMovies = $derived(watchlistState.movies);

	let canonicalUrl = $derived(page.url.href);
	let ogImage = $derived(data.featured?.backdropUrl || data.featured?.posterUrl || '');
	const metaDescription =
		'Discover cinematic masterpieces, trending releases, and upcoming premieres through an editorial film browsing experience on Cineva.';
</script>

<svelte:head>
	<title>Cineva — Find your next favorite</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph / Social Sharing -->
	<meta property="og:site_name" content="Cineva" />
	<meta property="og:title" content="Cineva — Find your next favorite" />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonicalUrl} />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
	{/if}

	<!-- Twitter Cards -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Cineva — Find your next favorite" />
	<meta name="twitter:description" content={metaDescription} />
	{#if ogImage}
		<meta name="twitter:image" content={ogImage} />
	{/if}
</svelte:head>

<div class="flex flex-col">
	<!-- A. Featured Hero Section -->
	{#if data.featured}
		<HeroMovie movie={data.featured} />
	{:else}
		<!-- Fallback hero banner if TMDB data is temporarily unreachable -->
		<section
			class="relative flex min-h-[380px] w-full items-center justify-center border-b border-cinema-border bg-cinema-surface/40 px-4 py-16 text-center"
			aria-label="Featured Film Placeholder"
		>
			<div class="mx-auto max-w-xl">
				<div
					class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cinema-border bg-cinema-elevated text-cinema-accent"
				>
					<Film class="h-7 w-7" />
				</div>
				<h1
					class="font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-cinema-text sm:text-4xl"
				>
					Discover Cinema on Cineva
				</h1>
				<p class="mt-3 text-sm leading-relaxed text-cinema-text-muted sm:text-base">
					Curated film exploration celebrating storytelling, visionary direction, and visual craft.
				</p>
				{#if data.trending.error}
					<div class="mt-6">
						<SectionError title="Live movie data unavailable" message={data.trending.error} />
					</div>
				{/if}
			</div>
		</section>
	{/if}

	<!-- B. Trending Movies (Horizontal Row) -->
	<MovieRow
		title="Trending This Week"
		subtitle="Curated cinematic releases capturing audiences worldwide"
		movies={data.trending.movies}
		error={data.trending.error}
		viewAllHref="/explore"
	/>

	<!-- Personalized: Watchlist Quick Queue (Only shown when user has saved titles) -->
	{#if watchlistMovies.length > 0}
		<MovieRow
			title="From Your Watchlist"
			subtitle="Titles in your saved collection ready for viewing"
			movies={watchlistMovies}
			viewAllHref="/watchlist"
		/>
	{/if}

	<!-- Personalized: Recently Viewed (Only shown when user has browsing history) -->
	{#if recentlyViewed.length > 0}
		<MovieRow
			title="Recently Viewed"
			subtitle="Pick up where you left off from your recent explorations"
			movies={recentlyViewed}
		/>
	{/if}

	<!-- C. Now Playing in Theaters (Horizontal Row) -->
	<MovieRow
		title="Now in Theaters"
		subtitle="Current theatrical releases playing on the big screen right now"
		movies={data.nowPlaying.movies}
		error={data.nowPlaying.error}
		viewAllHref="/explore"
	/>

	<!-- D. Explore by Genre Section (Thematic Browsing) -->
	<section
		class="border-y border-cinema-border bg-cinema-bg py-10 transition-colors duration-200 sm:py-12"
		aria-label="Browse by Genre"
	>
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mb-6 flex items-end justify-between gap-4">
				<div>
					<h2
						class="font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-cinema-text sm:text-3xl"
					>
						Explore by Genre
					</h2>
					<p class="mt-1 text-sm text-cinema-text-muted">
						Navigate by thematic tradition, mood, and visual storytelling
					</p>
				</div>
				<a
					href="/explore"
					class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-cinema-accent transition-all duration-200 hover:text-cinema-accent-hover hover:underline focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
				>
					<span>All Genres</span>
					<ArrowRight class="h-3.5 w-3.5" />
				</a>
			</div>

			<div class="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
				{#each GENRES as genre (genre.id)}
					<GenreTile {genre} />
				{/each}
			</div>
		</div>
	</section>

	<!-- E. Popular & Acclaimed Movies (Responsive Grid for Layout Diversity) -->
	<section class="py-10 sm:py-12" aria-label="Popular & Acclaimed">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mb-6 flex items-end justify-between gap-4">
				<div>
					<h2
						class="font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-cinema-text sm:text-3xl"
					>
						Popular & Acclaimed
					</h2>
					<p class="mt-1 text-sm text-cinema-text-muted">
						Celebrated works captivating audiences and critics across the globe
					</p>
				</div>
				<a
					href="/explore?sortBy=vote_average.desc"
					class="hidden items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold text-cinema-accent hover:underline focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none sm:inline-flex"
				>
					<span>View Top Rated</span>
					<ArrowRight class="h-3.5 w-3.5" />
				</a>
			</div>

			<MovieGrid movies={data.popular.movies.slice(0, 10)} error={data.popular.error} />
		</div>
	</section>

	<!-- F. Upcoming Movies (Horizontal Row with Release Tags) -->
	<MovieRow
		title="Anticipated Releases"
		subtitle="Upcoming theatrical premieres scheduled for global release"
		movies={data.upcoming.movies}
		error={data.upcoming.error}
		viewAllHref="/explore?sortBy=primary_release_date.desc"
	/>
</div>
