<script lang="ts">
	import type { Movie } from '#lib/types/movie';
	import MovieCard from './MovieCard.svelte';
	import MovieCardSkeleton from './MovieCardSkeleton.svelte';
	import SectionError from '#lib/components/ui/SectionError.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-svelte';

	interface Props {
		title: string;
		subtitle?: string;
		movies: Movie[];
		viewAllHref?: string;
		error?: string | null;
		loading?: boolean;
		emptyTitle?: string;
		emptyDescription?: string;
		onretry?: () => void;
	}

	let {
		title,
		subtitle,
		movies,
		viewAllHref,
		error = null,
		loading = false,
		emptyTitle = 'No titles found',
		emptyDescription = 'There are currently no movies available in this collection.',
		onretry
	}: Props = $props();

	let scrollContainer = $state<HTMLDivElement | null>(null);

	function scroll(direction: 'left' | 'right') {
		if (!scrollContainer) return;
		const offset = direction === 'left' ? -380 : 380;
		scrollContainer.scrollBy({ left: offset, behavior: 'smooth' });
	}
</script>

<section class="py-8 sm:py-10" aria-label={title}>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<!-- Section Header -->
		<div class="mb-5 flex items-end justify-between gap-4">
			<div>
				<h2
					class="font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-cinema-text sm:text-3xl"
				>
					{title}
				</h2>
				{#if subtitle}
					<p class="mt-1 text-sm text-cinema-text-muted">
						{subtitle}
					</p>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				{#if viewAllHref && !error && movies.length > 0}
					<a
						href={viewAllHref}
						class="hidden items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold text-cinema-accent hover:underline focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none sm:inline-flex"
					>
						<span>View All</span>
						<ArrowRight class="h-3.5 w-3.5" />
					</a>
				{/if}

				<!-- Left/Right Scroll Controls -->
				{#if !error && (loading || movies.length > 0)}
					<div class="flex items-center gap-1">
						<button
							type="button"
							onclick={() => scroll('left')}
							class="flex h-8 w-8 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
							aria-label="Scroll left in {title}"
						>
							<ChevronLeft class="h-4 w-4" />
						</button>
						<button
							type="button"
							onclick={() => scroll('right')}
							class="flex h-8 w-8 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
							aria-label="Scroll right in {title}"
						>
							<ChevronRight class="h-4 w-4" />
						</button>
					</div>
				{/if}
			</div>
		</div>

		{#if error}
			<!-- Graceful Section Error State -->
			<SectionError title="Unable to load {title.toLowerCase()}" message={error} {onretry} />
		{:else if loading}
			<!-- Skeleton Loading State -->
			<div
				class="custom-scrollbar flex gap-4 overflow-hidden pt-1 pb-4 sm:gap-6"
				aria-busy="true"
				aria-label="Loading {title}"
			>
				{#each Array.from({ length: 6 }, (_, idx) => idx) as idx (idx)}
					<div class="w-[180px] flex-shrink-0 sm:w-[210px] md:w-[230px]">
						<MovieCardSkeleton />
					</div>
				{/each}
			</div>
		{:else if movies.length === 0}
			<!-- Empty State -->
			<EmptyState title={emptyTitle} description={emptyDescription} />
		{:else}
			<!-- Horizontal Scroll Track -->
			<div
				bind:this={scrollContainer}
				class="custom-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pt-1 pb-4 sm:gap-6"
				role="region"
				aria-label="{title} movie list"
			>
				{#each movies as movie (movie.id)}
					<div class="w-[180px] flex-shrink-0 snap-start sm:w-[210px] md:w-[230px]">
						<MovieCard {movie} />
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>
