<script lang="ts">
	import { page } from '$app/state';
	import { MOCK_MOVIES } from '#lib/data/mock-movies';
	import MovieCard from '#lib/components/movie/MovieCard.svelte';
	import { Star, User, Bookmark, Check, Share2, ArrowLeft } from 'lucide-svelte';

	let movieId = $derived(page.params.id);

	// Find the movie or fallback to first movie if not found
	let movie = $derived(
		MOCK_MOVIES.find((m) => m.id === movieId) || {
			...MOCK_MOVIES[0],
			id: movieId,
			title: 'Cinematic Archive Feature',
			overview: 'An uncataloged archival entry from the Phase 1 demonstration collection.'
		}
	);

	let inWatchlist = $state(false);
	let copiedLink = $state(false);

	function toggleWatchlist() {
		inWatchlist = !inWatchlist;
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

	// Related movies excluding current
	let similarMovies = $derived(MOCK_MOVIES.filter((m) => m.id !== movie.id).slice(0, 4));

	// Placeholder Cast items for Phase 1
	const mockCast = [
		{ name: 'Aria Sterling', role: 'Lead Protagonist' },
		{ name: 'Dr. Lucas Chen', role: 'Senior Science Advisor' },
		{ name: 'Valerie Moreau', role: 'Station Commander' },
		{ name: 'Kaelen Voss', role: 'Archival Specialist' }
	];
</script>

<svelte:head>
	<title>{movie.title} {movie.releaseYear ? `(${movie.releaseYear})` : ''} - Cineva</title>
	<meta name="description" content={movie.overview} />
</svelte:head>

<div class="relative w-full">
	<!-- Top Navigation Backlink -->
	<div class="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
		<a
			href="/"
			class="inline-flex items-center gap-1.5 rounded py-1 text-xs font-semibold text-cinema-text-muted transition-colors hover:text-cinema-accent focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
		>
			<ArrowLeft class="h-3.5 w-3.5" />
			<span>Back to Discovery</span>
		</a>
	</div>

	<!-- Cinematic Backdrop Banner Section -->
	<div
		class="relative mt-4 min-h-[360px] w-full overflow-hidden border-b border-cinema-border bg-cinema-bg sm:min-h-[440px] lg:min-h-[500px]"
	>
		<div class="absolute inset-0 z-0">
			<img
				src={movie.backdropUrl}
				alt="Backdrop for {movie.title}"
				class="h-full w-full object-cover opacity-35 transition-opacity duration-300 dark:opacity-45"
			/>
			<div
				class="absolute inset-0 bg-gradient-to-t from-cinema-bg via-cinema-bg/75 to-transparent"
			></div>
			<div
				class="absolute inset-0 bg-gradient-to-r from-cinema-bg via-cinema-bg/85 to-transparent lg:w-3/5"
			></div>
		</div>

		<!-- Movie Overview Container -->
		<div class="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div class="flex flex-col items-start gap-8 md:flex-row">
				<!-- 2:3 Poster Card -->
				<div
					class="mx-auto w-48 flex-shrink-0 overflow-hidden rounded-xl border border-cinema-border shadow-xl sm:w-60 md:mx-0 md:w-64"
				>
					<div class="relative aspect-[2/3] w-full bg-cinema-surface">
						<img
							src={movie.posterUrl}
							alt="Poster for {movie.title}"
							class="h-full w-full object-cover"
						/>
					</div>
				</div>

				<!-- Movie Header & Primary Details -->
				<div class="max-w-2xl flex-1">
					<!-- Release Year & Badges -->
					<div class="flex flex-wrap items-center gap-2.5">
						{#if movie.contentRating}
							<span
								class="rounded border border-cinema-border/50 bg-cinema-elevated px-2 py-0.5 text-xs font-semibold text-cinema-text-muted"
							>
								{movie.contentRating}
							</span>
						{/if}
						{#if movie.releaseYear}
							<span class="font-mono text-xs text-cinema-text-muted">{movie.releaseYear}</span>
						{/if}
						{#if movie.runtime}
							<span class="text-xs text-cinema-text-muted">&bull;</span>
							<span class="text-xs text-cinema-text-muted">{movie.runtime}</span>
						{/if}
						{#if movie.rating != null && movie.rating > 0}
							<div
								class="flex items-center gap-1 rounded-full border border-cinema-border bg-cinema-surface px-2.5 py-0.5 text-xs font-semibold text-cinema-accent shadow-xs"
							>
								<Star class="h-3 w-3 fill-current" />
								<span>{movie.rating.toFixed(1)} / 10</span>
							</div>
						{/if}
					</div>

					<h1
						class="mt-3 font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-cinema-text sm:text-4xl lg:text-5xl"
					>
						{movie.title}
					</h1>

					{#if movie.tagline}
						<p class="mt-2 text-sm text-cinema-text-muted italic sm:text-base">
							"{movie.tagline}"
						</p>
					{/if}

					<!-- Genre Pills -->
					<div class="mt-4 flex flex-wrap gap-2">
						{#each movie.genres as genre (genre)}
							<span
								class="rounded-full border border-cinema-border bg-cinema-surface px-3 py-1 text-xs font-medium text-cinema-text shadow-xs"
							>
								{genre}
							</span>
						{/each}
					</div>

					<!-- Overview -->
					<div class="mt-6">
						<h2
							class="font-['Space_Grotesk'] text-sm font-semibold tracking-wider text-cinema-text-muted"
						>
							SYNOPSIS
						</h2>
						<p class="mt-2 text-sm leading-relaxed text-cinema-text/90 sm:text-base">
							{movie.overview}
						</p>
					</div>

					<!-- Key Crew -->
					{#if movie.director}
						<div class="mt-6 flex items-center gap-2 text-sm text-cinema-text-muted">
							<User class="h-4 w-4 text-cinema-accent" />
							<span
								>Directed by <strong class="font-semibold text-cinema-text">{movie.director}</strong
								></span
							>
						</div>
					{/if}

					<!-- Interactive Action Controls -->
					<div class="mt-8 flex flex-wrap items-center gap-3">
						<button
							type="button"
							onclick={toggleWatchlist}
							class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cinema-accent px-6 text-sm font-semibold text-cinema-accent-foreground shadow-sm transition-colors hover:bg-cinema-accent-hover focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
						>
							{#if inWatchlist}
								<Check class="h-4 w-4" />
								<span>In Your Watchlist</span>
							{:else}
								<Bookmark class="h-4 w-4" />
								<span>Add to Watchlist</span>
							{/if}
						</button>

						<button
							type="button"
							onclick={shareMovie}
							class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-5 text-sm font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
						>
							<Share2 class="h-4 w-4" />
							<span>{copiedLink ? 'Link Copied!' : 'Share Film'}</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Additional Information & Cast Placeholders (Phase 1 preview) -->
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<!-- Cast Section Preview -->
		<section class="border-b border-cinema-border pb-10" aria-label="Cast Information">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="font-['Space_Grotesk'] text-xl font-bold text-cinema-text">Featured Cast</h2>
				<span class="font-mono text-xs text-cinema-text-muted">Phase 4 TMDB Credits Preview</span>
			</div>

			<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{#each mockCast as member (member.name)}
					<div
						class="flex flex-col items-start rounded-xl border border-cinema-border bg-cinema-surface p-4 shadow-xs"
					>
						<div
							class="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-cinema-border bg-cinema-elevated text-cinema-accent"
						>
							<User class="h-5 w-5" />
						</div>
						<span class="font-['Space_Grotesk'] text-sm font-semibold text-cinema-text"
							>{member.name}</span
						>
						<span class="mt-0.5 text-xs text-cinema-text-muted">{member.role}</span>
					</div>
				{/each}
			</div>
		</section>

		<!-- Similar Recommendations Section -->
		<section class="pt-10" aria-label="Similar Titles">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="font-['Space_Grotesk'] text-xl font-bold text-cinema-text">More Like This</h2>
				<a href="/explore" class="text-xs font-semibold text-cinema-accent hover:underline">
					Explore Catalog
				</a>
			</div>

			<div class="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
				{#each similarMovies as similar (similar.id)}
					<MovieCard movie={similar} />
				{/each}
			</div>
		</section>
	</div>
</div>
