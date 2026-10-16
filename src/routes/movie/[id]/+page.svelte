<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import MovieCard from '#lib/components/movie/MovieCard.svelte';
	import MovieCast from '#lib/components/movie/MovieCast.svelte';
	import MovieInfo from '#lib/components/movie/MovieInfo.svelte';
	import MovieArtworkGallery from '#lib/components/movie/MovieArtworkGallery.svelte';
	import TrailerModal from '#lib/components/movie/TrailerModal.svelte';
	import WatchlistButton from '#lib/components/movie/WatchlistButton.svelte';
	import SectionError from '#lib/components/ui/SectionError.svelte';
	import { personalizationState } from '#lib/personalization.svelte';
	import { Star, Play, Share2, ArrowLeft, Film, Info, Sparkles, Images } from 'lucide-svelte';

	let { data }: PageProps = $props();
	let movie = $derived(data.movie);
	let similar = $derived(data.similar);
	let recommendations = $derived(data.recommendations);
	let gallery = $derived(
		data.gallery ||
			movie.gallery || {
				posters: [],
				backdrops: [],
				logos: [],
				all: [],
				totalCount: 0,
				error: null
			}
	);

	// State
	let trailerModalOpen = $state(false);
	let copiedLink = $state(false);
	let backdropError = $state(false);
	let posterError = $state(false);

	// Record recently viewed movie on client mount
	$effect(() => {
		const currentMovie = movie;
		if (currentMovie && typeof window !== 'undefined') {
			untrack(() => {
				personalizationState.addRecentlyViewed(currentMovie);
			});
		}
	});

	function openTrailer() {
		if (movie.trailer) {
			trailerModalOpen = true;
		}
	}

	function closeTrailer() {
		trailerModalOpen = false;
	}

	function shareMovie() {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(window.location.href);
			copiedLink = true;
			setTimeout(() => {
				copiedLink = false;
			}, 2000);
		}
	}

	function scrollToDetails() {
		if (typeof document !== 'undefined') {
			const target = document.getElementById('details');
			target?.scrollIntoView({ behavior: 'smooth' });
		}
	}

	function scrollToGallery() {
		if (typeof document !== 'undefined') {
			const target = document.getElementById('gallery');
			target?.scrollIntoView({ behavior: 'smooth' });
		}
	}

	let canonicalUrl = $derived(page.url.href);
	let ogImage = $derived(movie.backdropUrl || movie.posterUrl || '');
	let formattedRating = $derived(
		typeof movie.rating === 'number' && !Number.isNaN(movie.rating) && movie.rating > 0
			? movie.rating.toFixed(1)
			: null
	);
	let formattedVotes = $derived(
		movie.voteCount && movie.voteCount > 0
			? new Intl.NumberFormat('en-US').format(movie.voteCount)
			: null
	);
</script>

<svelte:head>
	<title>{movie.title} {movie.releaseYear ? `(${movie.releaseYear})` : ''} — Scenora</title>
	<meta name="description" content={movie.overview} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph / Social Sharing -->
	<meta property="og:site_name" content="Scenora" />
	<meta
		property="og:title"
		content="{movie.title} {movie.releaseYear ? `(${movie.releaseYear})` : ''} — Scenora"
	/>
	<meta property="og:description" content={movie.overview} />
	<meta property="og:type" content="video.movie" />
	<meta property="og:url" content={canonicalUrl} />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
	{/if}

	<!-- Twitter Cards -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:title"
		content="{movie.title} {movie.releaseYear ? `(${movie.releaseYear})` : ''} — Scenora"
	/>
	<meta name="twitter:description" content={movie.overview} />
	{#if ogImage}
		<meta name="twitter:image" content={ogImage} />
	{/if}
</svelte:head>

<div class="relative w-full overflow-hidden">
	<!-- Top Navigation Backlink -->
	<div class="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
		<a
			href="/explore"
			class="inline-flex items-center gap-1.5 rounded-lg py-1 text-xs font-semibold text-cinema-text-muted transition-colors hover:text-cinema-accent focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
		>
			<ArrowLeft class="h-3.5 w-3.5" />
			<span>Back to Discovery</span>
		</a>
	</div>

	<!-- Cinematic Hero Section -->
	<section
		class="relative mt-4 min-h-[460px] w-full overflow-hidden border-b border-cinema-border bg-cinema-bg sm:min-h-[520px] lg:min-h-[580px]"
		aria-label="Film Overview and Hero"
	>
		<!-- Background Art with Multi-Stage High Contrast Scrim -->
		<div class="absolute inset-0 z-0 overflow-hidden bg-cinema-surface">
			{#if movie.backdropUrl && !backdropError}
				<img
					src={movie.backdropUrl}
					alt="Cinematic backdrop for {movie.title}"
					fetchpriority="high"
					loading="eager"
					onerror={() => (backdropError = true)}
					class="h-full w-full object-cover object-center opacity-30 transition-opacity duration-300 dark:opacity-45"
				/>
			{:else}
				<div
					class="flex h-full w-full items-center justify-center bg-gradient-to-br from-cinema-surface via-cinema-elevated to-cinema-bg"
				>
					<Film class="h-28 w-28 text-cinema-border opacity-20" />
				</div>
			{/if}

			<!-- Multi-stage Scrim: Bottom Fade & Left Radial/Linear Gradient -->
			<div
				class="absolute inset-0 bg-gradient-to-t from-cinema-bg via-cinema-bg/85 to-transparent"
			></div>
			<div
				class="absolute inset-0 bg-gradient-to-r from-cinema-bg via-cinema-bg/90 to-transparent lg:w-4/5"
			></div>
		</div>

		<!-- Hero Content Container -->
		<div class="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
			<div class="flex flex-col items-center gap-8 md:flex-row md:items-start lg:gap-12">
				<!-- 2:3 Movie Poster Card -->
				<div
					class="w-48 flex-shrink-0 overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-2xl sm:w-60 md:w-64 lg:w-72"
				>
					<div class="relative aspect-[2/3] w-full overflow-hidden bg-cinema-elevated">
						{#if movie.posterUrl && !posterError}
							<img
								src={movie.posterUrl}
								alt="Official poster for {movie.title}"
								fetchpriority="high"
								loading="eager"
								onerror={() => (posterError = true)}
								class="h-full w-full object-cover"
							/>
						{:else}
							<div
								class="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-cinema-surface to-cinema-elevated p-4 text-center"
							>
								<div
									class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-cinema-border bg-cinema-bg text-cinema-accent"
								>
									<Film class="h-6 w-6" />
								</div>
								<span
									class="line-clamp-2 font-['Space_Grotesk'] text-sm font-bold text-cinema-text"
								>
									{movie.title}
								</span>
								<span class="mt-1 text-xs text-cinema-text-muted">Poster Unavailable</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Movie Header & Primary Details -->
				<div class="max-w-3xl flex-1 text-center md:text-left">
					<!-- Badges & Release Year -->
					<div class="flex flex-wrap items-center justify-center gap-2.5 md:justify-start">
						{#if movie.releaseYear}
							<span class="font-mono text-xs font-semibold text-cinema-text-muted sm:text-sm">
								{movie.releaseYear}
							</span>
						{/if}

						{#if movie.runtime}
							{#if movie.releaseYear}
								<span class="text-xs text-cinema-text-muted">&bull;</span>
							{/if}
							<span class="font-mono text-xs text-cinema-text-muted sm:text-sm">
								{movie.runtime}
							</span>
						{/if}

						{#if formattedRating}
							<div
								class="flex items-center gap-1.5 rounded-full border border-cinema-border bg-cinema-surface/90 px-2.5 py-0.5 text-xs font-semibold text-cinema-accent shadow-xs"
							>
								<Star class="h-3 w-3 fill-current" />
								<span>{formattedRating} / 10</span>
								{#if formattedVotes}
									<span class="font-normal text-cinema-text-muted">({formattedVotes})</span>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Main Title -->
					<h1
						class="mt-4 font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-cinema-text sm:text-4xl lg:text-5xl"
					>
						{movie.title}
					</h1>

					<!-- Original Title if different -->
					{#if movie.originalTitle}
						<p class="mt-1 text-xs font-medium text-cinema-text-muted sm:text-sm">
							Original: <span class="text-cinema-text">{movie.originalTitle}</span>
						</p>
					{/if}

					<!-- Tagline -->
					{#if movie.tagline}
						<p class="mt-2 text-sm text-cinema-text-muted italic sm:text-base">
							"{movie.tagline}"
						</p>
					{/if}

					<!-- Genre Pills -->
					{#if movie.genres && movie.genres.length > 0}
						<div class="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
							{#each movie.genres as genre (genre)}
								<span
									class="rounded-full border border-cinema-border bg-cinema-surface px-3 py-1 text-xs font-medium text-cinema-text shadow-xs"
								>
									{genre}
								</span>
							{/each}
						</div>
					{/if}

					<!-- Overview Snippet -->
					<p class="mt-5 line-clamp-4 text-sm leading-relaxed text-cinema-text/90 sm:text-base">
						{movie.overview}
					</p>

					<!-- Action Controls -->
					<div class="mt-8 flex flex-wrap items-center justify-center gap-3.5 md:justify-start">
						{#if movie.trailer}
							<button
								type="button"
								onclick={openTrailer}
								class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cinema-accent px-6 text-sm font-semibold text-cinema-accent-foreground shadow-sm transition-all hover:bg-cinema-accent-hover hover:shadow-md focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none active:scale-[0.98]"
							>
								<Play class="h-4 w-4 fill-current" />
								<span>Watch Trailer</span>
							</button>
						{/if}

						<button
							type="button"
							onclick={scrollToDetails}
							class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-5 text-sm font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
						>
							<Info class="h-4 w-4 text-cinema-text-muted" />
							<span>Film Facts</span>
						</button>

						{#if gallery.totalCount > 0}
							<button
								type="button"
								onclick={scrollToGallery}
								class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-5 text-sm font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
							>
								<Images class="h-4 w-4 text-cinema-text-muted" />
								<span>Gallery ({gallery.totalCount})</span>
							</button>
						{/if}

						<WatchlistButton {movie} variant="button" />

						<button
							type="button"
							onclick={shareMovie}
							class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cinema-border bg-cinema-surface text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
							title="Share Movie Link"
							aria-label="Share Movie Link"
						>
							<Share2 class="h-4 w-4" />
						</button>

						{#if copiedLink}
							<span class="text-xs font-semibold text-cinema-accent">Link copied!</span>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Main Content Area: Facts, Cast, Crew, Gallery, Similar, and Recommendations -->
	<div class="mx-auto max-w-7xl space-y-16 px-4 py-14 sm:px-6 lg:px-8">
		<!-- Section 1: Detailed Specifications & Context -->
		<section id="details" class="scroll-mt-24 border-b border-cinema-border pb-16">
			<MovieInfo {movie} />
		</section>

		<!-- Section 2: Filmmakers and Principal Cast -->
		<section class="border-b border-cinema-border pb-16">
			<MovieCast cast={movie.cast} keyCrew={movie.keyCrew} />
		</section>

		<!-- Section 3: Official Artwork Gallery -->
		<section
			id="gallery"
			class="scroll-mt-24 border-b border-cinema-border pb-16"
			aria-label="Official Artwork Gallery"
		>
			<MovieArtworkGallery {gallery} movieTitle={movie.title} />
		</section>

		<!-- Section 4: Similar Movies (Rendered only when data is available or error occurred) -->
		{#if similar.error}
			<section aria-label="Similar Movies" class="border-b border-cinema-border pb-16">
				<SectionError title="Similar Titles Unavailable" message={similar.error} />
			</section>
		{:else if similar.movies.length > 0}
			<section aria-label="Similar Movies" class="border-b border-cinema-border pb-16">
				<div class="mb-6 flex items-baseline justify-between">
					<div>
						<h2 class="font-['Space_Grotesk'] text-xl font-bold text-cinema-text sm:text-2xl">
							Similar Movies
						</h2>
						<p class="mt-1 text-xs text-cinema-text-muted">
							Titles sharing genre elements, tone, and cinematic styles
						</p>
					</div>
					<a
						href="/explore"
						class="text-xs font-semibold text-cinema-accent transition-colors hover:underline"
					>
						Browse Catalog
					</a>
				</div>

				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-4">
					{#each similar.movies as simMovie (simMovie.id)}
						<MovieCard movie={simMovie} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Section 5: Recommended Movies (Rendered only when data is available or error occurred) -->
		{#if recommendations.error}
			<section aria-label="Recommended Titles">
				<SectionError title="Recommendations Unavailable" message={recommendations.error} />
			</section>
		{:else if recommendations.movies.length > 0}
			<section aria-label="Recommended Titles">
				<div class="mb-6 flex items-baseline justify-between">
					<div class="flex items-center gap-2">
						<div
							class="flex h-7 w-7 items-center justify-center rounded-lg bg-cinema-accent/15 text-cinema-accent"
						>
							<Sparkles class="h-4 w-4" />
						</div>
						<div>
							<h2 class="font-['Space_Grotesk'] text-xl font-bold text-cinema-text sm:text-2xl">
								Recommended For You
							</h2>
							<p class="mt-0.5 text-xs text-cinema-text-muted">
								Curated recommendations based on viewer preferences and thematic connections
							</p>
						</div>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-4">
					{#each recommendations.movies as recMovie (recMovie.id)}
						<MovieCard movie={recMovie} />
					{/each}
				</div>
			</section>
		{/if}
	</div>
</div>

<!-- Trailer Modal Player -->
{#if movie.trailer}
	<TrailerModal
		bind:open={trailerModalOpen}
		trailer={movie.trailer}
		movieTitle={movie.title}
		onclose={closeTrailer}
	/>
{/if}
