<script lang="ts">
	import type { Movie } from '#lib/types/movie';
	import { Star, Film, Calendar } from 'lucide-svelte';

	interface Props {
		movie: Movie;
		class?: string;
	}

	let { movie, class: className = '' }: Props = $props();

	let imageError = $state(false);

	function handleImageError() {
		imageError = true;
	}

	const ariaLabel = $derived(
		movie.releaseYear ? `${movie.title} (${movie.releaseYear})` : movie.title
	);
</script>

<article class="group relative flex flex-col {className}">
	<a
		href="/movie/{movie.id}"
		class="relative block w-full overflow-hidden rounded-xl border border-cinema-border bg-cinema-surface shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-cinema-accent/50 group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.15)] focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none dark:group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)]"
		aria-label={ariaLabel}
	>
		<!-- 2:3 Poster Aspect Ratio Container with reserved space -->
		<div class="relative aspect-[2/3] w-full overflow-hidden bg-cinema-surface">
			{#if movie.posterUrl && !imageError}
				<img
					src={movie.posterUrl}
					alt="Official poster for {movie.title}"
					loading="lazy"
					onerror={handleImageError}
					class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
				/>
			{:else}
				<!-- Missing artwork fallback state -->
				<div
					class="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-cinema-surface to-cinema-bg p-4 text-center"
				>
					<div
						class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-cinema-border bg-cinema-elevated text-cinema-text-muted"
					>
						<Film class="h-6 w-6" />
					</div>
					<span class="line-clamp-2 font-['Space_Grotesk'] text-sm font-bold text-cinema-text">
						{movie.title}
					</span>
					<span class="mt-1 text-xs text-cinema-text-muted">No Artwork</span>
				</div>
			{/if}

			<!-- Rating Badge (top right, only if valid rating exists) -->
			{#if movie.rating != null && movie.rating > 0}
				<div
					class="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-md border border-cinema-border/50 bg-cinema-bg/85 px-2 py-0.5 text-xs font-semibold text-cinema-text shadow-xs backdrop-blur-md"
				>
					<Star class="h-3 w-3 fill-cinema-accent text-cinema-accent" />
					<span>{movie.rating.toFixed(1)}</span>
				</div>
			{/if}

			<!-- Release/Upcoming Tag (top left if upcoming) -->
			{#if movie.isUpcoming && movie.releaseDateText}
				<div
					class="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-md bg-cinema-accent px-2 py-0.5 text-[11px] font-bold text-cinema-accent-foreground shadow-xs"
				>
					<Calendar class="h-3 w-3" />
					<span>{movie.releaseDateText}</span>
				</div>
			{:else if movie.genres && movie.genres.length > 0}
				<div
					class="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md border border-cinema-border/40 bg-cinema-bg/85 px-2 py-0.5 text-[10px] font-medium text-cinema-text-muted backdrop-blur-md"
				>
					<span>{movie.genres[0]}</span>
				</div>
			{/if}
		</div>
	</a>

	<!-- Essential Movie Metadata (Always Visible Below Card) -->
	<div class="mt-2.5 flex flex-col">
		<h3
			class="line-clamp-1 font-['Space_Grotesk'] text-sm font-semibold text-cinema-text transition-colors group-hover:text-cinema-accent"
		>
			<a href="/movie/{movie.id}" class="focus-visible:underline focus-visible:outline-none">
				{movie.title}
			</a>
		</h3>
		<div class="mt-1 flex items-center gap-2 text-xs text-cinema-text-muted">
			{#if movie.releaseYear}
				<span>{movie.releaseYear}</span>
			{/if}
			{#if movie.runtime}
				{#if movie.releaseYear}
					<span>&bull;</span>
				{/if}
				<span>{movie.runtime}</span>
			{/if}
		</div>
	</div>
</article>
