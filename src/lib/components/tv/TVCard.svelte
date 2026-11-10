<script lang="ts">
	import type { TVShow } from '#lib/types/tv';
	import type { PersonCreditTV } from '#lib/types/person';
	import { Star, Tv, Calendar } from 'lucide-svelte';
	import WatchlistButton from '#lib/components/movie/WatchlistButton.svelte';

	interface Props {
		show: TVShow | PersonCreditTV;
		class?: string;
		subtitle?: string;
	}

	let { show, class: className = '', subtitle }: Props = $props();

	let imageError = $state(false);

	function handleImageError() {
		imageError = true;
	}

	const displayYear = $derived(
		'firstAirYear' in show && show.firstAirYear != null
			? show.firstAirYear
			: 'releaseYear' in show && show.releaseYear != null
				? show.releaseYear
				: null
	);

	const ariaLabel = $derived(
		displayYear ? `${show.name} (${displayYear})` : show.name
	);
</script>

<article class="group relative flex flex-col {className}">
	<div
		class="relative w-full overflow-hidden rounded-xl border border-cinema-border bg-cinema-surface shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-cinema-accent/50 group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.15)] dark:group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)]"
	>
		<a
			href="/tv/{show.id}"
			class="relative block w-full focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
			aria-label={ariaLabel}
		>
			<!-- 2:3 Poster Aspect Ratio Container with reserved space -->
			<div class="relative aspect-[2/3] w-full overflow-hidden bg-cinema-surface">
				{#if show.posterUrl && !imageError}
					<img
						src={show.posterUrl}
						alt="Official poster for {show.name}"
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
							<Tv class="h-6 w-6" />
						</div>
						<span class="line-clamp-2 font-['Space_Grotesk'] text-sm font-bold text-cinema-text">
							{show.name}
						</span>
						<span class="mt-1 text-xs text-cinema-text-muted">No Artwork</span>
					</div>
				{/if}

				<!-- Content-Type Badge (top left) -->
				<div
					class="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-md border border-cinema-border/50 bg-cinema-bg/85 px-2 py-0.5 text-[10px] font-bold tracking-wider text-cinema-accent uppercase shadow-xs backdrop-blur-md"
				>
					<Tv class="h-3 w-3" />
					<span>TV Series</span>
				</div>

				<!-- Rating Badge (top right, only if valid rating exists) -->
				{#if typeof show.rating === 'number' && !Number.isNaN(show.rating) && show.rating > 0}
					<div
						class="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-md border border-cinema-border/50 bg-cinema-bg/85 px-2 py-0.5 text-xs font-semibold text-cinema-text shadow-xs backdrop-blur-md"
					>
						<Star class="h-3 w-3 fill-cinema-accent text-cinema-accent" />
						<span>{show.rating.toFixed(1)}</span>
					</div>
				{/if}

				<!-- Primary Genre or Origin Tag (bottom left) -->
				{#if show.genres && show.genres.length > 0}
					<div
						class="absolute bottom-2.5 left-2.5 max-w-[calc(100%-3.5rem)] truncate rounded-md border border-cinema-border/40 bg-cinema-bg/85 px-2 py-0.5 text-[10px] font-medium text-cinema-text-muted backdrop-blur-md"
					>
						<span>{show.genres[0]}</span>
					</div>
				{/if}
			</div>
		</a>

		<!-- Watchlist Action Button (bottom right of poster) -->
		<div class="absolute right-2.5 bottom-2.5 z-10">
			<WatchlistButton item={show} variant="icon" />
		</div>
	</div>

	<!-- Essential TV Series Metadata -->
	<div class="mt-2.5 flex flex-col">
		<h3
			class="line-clamp-1 font-['Space_Grotesk'] text-sm font-semibold text-cinema-text transition-colors group-hover:text-cinema-accent"
		>
			<a href="/tv/{show.id}" class="focus-visible:underline focus-visible:outline-none">
				{show.name}
			</a>
		</h3>
		{#if subtitle}
			<p class="mt-0.5 line-clamp-1 text-xs font-medium text-cinema-accent" title={subtitle}>
				{subtitle}
			</p>
		{/if}
		<div class="mt-1 flex items-center gap-2 text-xs text-cinema-text-muted">
			{#if displayYear}
				<span>{displayYear}</span>
			{/if}
			{#if 'numberOfSeasons' in show && show.numberOfSeasons}
				{#if displayYear}
					<span>&bull;</span>
				{/if}
				<span>{show.numberOfSeasons} {show.numberOfSeasons === 1 ? 'Season' : 'Seasons'}</span>
			{:else if 'episodeCount' in show && show.episodeCount}
				{#if displayYear}
					<span>&bull;</span>
				{/if}
				<span>{show.episodeCount} {show.episodeCount === 1 ? 'Episode' : 'Episodes'}</span>
			{:else if 'status' in show && show.status}
				{#if displayYear}
					<span>&bull;</span>
				{/if}
				<span>{show.status}</span>
			{/if}
		</div>
	</div>
</article>
