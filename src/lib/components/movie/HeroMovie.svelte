<script lang="ts">
	import type { Movie } from '#lib/types/movie';
	import { Star, Play, Film } from 'lucide-svelte';
	import WatchlistButton from './WatchlistButton.svelte';

	interface Props {
		movie: Movie;
	}

	let { movie }: Props = $props();

	let backdropError = $state(false);

	function handleBackdropError() {
		backdropError = true;
	}
</script>

<section
	class="relative w-full overflow-hidden border-b border-cinema-border bg-cinema-bg transition-colors duration-200"
	aria-label="Featured Film"
>
	<!-- Cinematic Wide Backdrop -->
	<div class="relative flex min-h-[480px] w-full items-center sm:min-h-[540px] lg:min-h-[600px]">
		<!-- Backdrop Image or Fallback -->
		<div class="absolute inset-0 z-0 overflow-hidden bg-cinema-surface">
			{#if movie.backdropUrl && !backdropError}
				<img
					src={movie.backdropUrl}
					alt="Backdrop visual for {movie.title}"
					fetchpriority="high"
					loading="eager"
					onerror={handleBackdropError}
					class="h-full w-full object-cover object-center opacity-40 transition-opacity duration-300 dark:opacity-60"
				/>
			{:else}
				<div
					class="flex h-full w-full items-center justify-center bg-gradient-to-br from-cinema-surface via-cinema-elevated to-cinema-bg"
				>
					<Film class="h-24 w-24 text-cinema-border opacity-30" />
				</div>
			{/if}
			<!-- Multi-stage Dark Gradient Overlays for High Legibility in Both Modes -->
			<div
				class="absolute inset-0 bg-gradient-to-t from-cinema-bg via-cinema-bg/75 to-transparent"
			></div>
			<div
				class="absolute inset-0 bg-gradient-to-r from-cinema-bg via-cinema-bg/85 to-transparent lg:w-3/4"
			></div>
		</div>

		<!-- Hero Content Stack (Max 4 Text Elements) -->
		<div class="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
			<div class="max-w-2xl">
				<!-- Element 1: Eyebrow Tag & Rating -->
				<div class="flex flex-wrap items-center gap-3">
					<span
						class="rounded-full border border-cinema-border bg-cinema-surface px-3 py-1 text-xs font-semibold tracking-wider text-cinema-accent"
					>
						FEATURED PRESENTATION
					</span>
					{#if movie.rating != null && movie.rating > 0}
						<div
							class="flex items-center gap-1.5 rounded-full border border-cinema-border bg-cinema-surface/90 px-2.5 py-1 text-xs font-medium text-cinema-text shadow-xs"
						>
							<Star class="h-3.5 w-3.5 fill-cinema-accent text-cinema-accent" />
							<span>{movie.rating.toFixed(1)}</span>
						</div>
					{/if}
					{#if movie.releaseYear}
						<span class="text-xs text-cinema-text-muted">{movie.releaseYear}</span>
					{/if}
				</div>

				<!-- Element 2: Headline -->
				<h1
					class="mt-4 font-['Space_Grotesk'] text-4xl font-bold tracking-tight text-cinema-text sm:text-5xl lg:text-6xl"
				>
					{movie.title}
				</h1>

				<!-- Element 3: Subtext (concise editorial overview) -->
				<p
					class="mt-4 line-clamp-3 max-w-xl text-base leading-relaxed text-cinema-text-muted sm:text-lg"
				>
					{movie.overview}
				</p>

				<!-- Genre and Metadata Pills -->
				<div class="mt-4 flex flex-wrap items-center gap-2">
					{#each movie.genres as genre (genre)}
						<span
							class="rounded-md border border-cinema-border/50 bg-cinema-elevated px-2.5 py-1 text-xs font-medium text-cinema-text-muted"
						>
							{genre}
						</span>
					{/each}
					{#if movie.runtime}
						<span class="text-xs text-cinema-text-muted">&bull;</span>
						<span class="text-xs text-cinema-text-muted">{movie.runtime}</span>
					{/if}
					{#if movie.director}
						<span class="text-xs text-cinema-text-muted">&bull;</span>
						<span class="text-xs text-cinema-text-muted">Directed by {movie.director}</span>
					{/if}
				</div>

				<!-- Element 4: CTAs -->
				<div class="mt-8 flex flex-wrap items-center gap-3">
					<a
						href="/movie/{movie.id}"
						class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cinema-accent px-6 text-sm font-semibold text-cinema-accent-foreground shadow-sm transition-colors hover:bg-cinema-accent-hover focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
					>
						<Play class="h-4 w-4 fill-current" />
						<span>View Details</span>
					</a>

					<WatchlistButton {movie} variant="button" />
				</div>
			</div>
		</div>
	</div>
</section>
