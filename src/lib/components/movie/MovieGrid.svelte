<script lang="ts">
	import type { Movie } from '#lib/types/movie';
	import MovieCard from './MovieCard.svelte';
	import MovieCardSkeleton from './MovieCardSkeleton.svelte';
	import SectionError from '#lib/components/ui/SectionError.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';

	interface Props {
		movies: Movie[];
		columns?: 'default' | 'compact';
		error?: string | null;
		loading?: boolean;
		emptyTitle?: string;
		emptyDescription?: string;
		onretry?: () => void;
	}

	let {
		movies,
		columns = 'default',
		error = null,
		loading = false,
		emptyTitle = 'No movies to display',
		emptyDescription = 'There are no movies found in this grid view.',
		onretry
	}: Props = $props();
</script>

{#if error}
	<SectionError title="Unable to load movies" message={error} {onretry} />
{:else if loading}
	<div
		class="grid gap-4 sm:gap-6 {columns === 'compact'
			? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
			: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5'}"
		aria-busy="true"
	>
		{#each Array.from({ length: 10 }, (_, idx) => idx) as idx (idx)}
			<MovieCardSkeleton />
		{/each}
	</div>
{:else if movies.length === 0}
	<EmptyState title={emptyTitle} description={emptyDescription} />
{:else}
	<div
		class="grid gap-4 sm:gap-6 {columns === 'compact'
			? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
			: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5'}"
	>
		{#each movies as movie (movie.id)}
			<MovieCard {movie} />
		{/each}
	</div>
{/if}
