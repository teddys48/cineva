<script lang="ts">
	import MovieGrid from '#lib/components/movie/MovieGrid.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import { MOCK_MOVIES } from '#lib/data/mock-movies';
	import { Bookmark } from 'lucide-svelte';

	// Phase 1 demo state for watchlist
	let demoList = $state([MOCK_MOVIES[0], MOCK_MOVIES[1], MOCK_MOVIES[7]]);
	let showEmpty = $state(false);

	function togglePreviewState() {
		showEmpty = !showEmpty;
	}
</script>

<svelte:head>
	<title>Personal Watchlist - Cineva</title>
	<meta name="description" content="Manage and explore your personal saved movie list in Cineva." />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Page Header -->
	<div
		class="flex flex-col gap-4 border-b border-cinema-border pb-6 sm:flex-row sm:items-end sm:justify-between"
	>
		<div>
			<div class="flex items-center gap-2 text-xs font-semibold tracking-wider text-cinema-accent">
				<Bookmark class="h-4 w-4" />
				<span>CURATION</span>
			</div>
			<h1
				class="mt-2 font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-cinema-text sm:text-4xl"
			>
				My Watchlist
			</h1>
			<p class="mt-2 max-w-xl text-sm text-cinema-text-muted">
				A curated queue of cinematic releases you intend to watch. Persistent storage arrives in
				Phase 5.
			</p>
		</div>

		<!-- Phase 1 UI Toggle to inspect empty state vs populated list -->
		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={togglePreviewState}
				class="rounded-lg border border-cinema-border bg-cinema-surface px-3 py-1.5 text-xs font-medium text-cinema-text-muted shadow-xs transition-colors hover:border-cinema-accent/40 hover:text-cinema-text focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
			>
				{showEmpty ? 'View Sample Watchlist' : 'Preview Empty State'}
			</button>
		</div>
	</div>

	<!-- Content Section -->
	<div class="mt-8">
		{#if showEmpty || demoList.length === 0}
			<EmptyState
				icon={Bookmark}
				title="Your Watchlist is Empty"
				description="You haven't saved any films yet. Explore our curated selections and click 'Add to Watchlist' on any title to queue it for later."
				actionHref="/explore"
				actionLabel="Discover Films"
			/>
		{:else}
			<div class="mb-4 flex items-center justify-between text-xs text-cinema-text-muted">
				<span
					>{demoList.length} saved title{demoList.length === 1 ? '' : 's'} (Phase 1 Preview)</span
				>
				<span class="font-mono text-[11px] text-cinema-accent"
					>localStorage persistence scheduled for Phase 5</span
				>
			</div>
			<MovieGrid movies={demoList} />
		{/if}
	</div>
</div>
