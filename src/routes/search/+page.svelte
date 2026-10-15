<script lang="ts">
	import MovieGrid from '#lib/components/movie/MovieGrid.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import { MOCK_MOVIES } from '#lib/data/mock-movies';
	import { Search, X, Clapperboard } from 'lucide-svelte';

	let searchQuery = $state('');

	const suggestedQueries = ['Space', 'Kyoto', 'Detective', 'Steampunk', 'Cybersecurity', 'Vienna'];

	let searchResults = $derived(
		searchQuery.trim() === ''
			? []
			: MOCK_MOVIES.filter(
					(m) =>
						m.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
						m.overview.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
						m.genres.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
						(m.director && m.director.toLowerCase().includes(searchQuery.toLowerCase().trim()))
				)
	);

	function setQuery(q: string) {
		searchQuery = q;
	}

	function clearQuery() {
		searchQuery = '';
	}
</script>

<svelte:head>
	<title>Search Archive - Cineva</title>
	<meta name="description" content="Search through movies, directors, and themes in Cineva." />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Search Header and Input -->
	<div class="mx-auto max-w-2xl text-center">
		<div
			class="inline-flex items-center gap-2 rounded-full border border-cinema-border bg-cinema-surface px-3 py-1 text-xs font-semibold text-cinema-accent shadow-xs"
		>
			<Search class="h-3.5 w-3.5" />
			<span>SEARCH ARCHIVE</span>
		</div>
		<h1
			class="mt-3 font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-cinema-text sm:text-4xl"
		>
			Search Cineva
		</h1>
		<p class="mt-2 text-sm text-cinema-text-muted">
			Find films by title, director, thematic keyword, or genre.
		</p>

		<!-- Search Input Bar -->
		<div class="relative mt-6">
			<div
				class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-cinema-text-muted"
			>
				<Search class="h-5 w-5 text-cinema-accent" />
			</div>
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Type a title, genre, or director..."
				class="w-full rounded-2xl border border-cinema-border bg-cinema-surface py-4 pr-12 pl-12 text-sm text-cinema-text placeholder-cinema-text-muted shadow-sm transition-all focus:border-cinema-accent focus:bg-cinema-elevated focus:ring-1 focus:ring-cinema-accent focus:outline-none"
			/>
			{#if searchQuery}
				<button
					type="button"
					onclick={clearQuery}
					class="absolute inset-y-0 right-0 flex items-center pr-4 text-cinema-text-muted hover:text-cinema-text"
					aria-label="Clear search query"
				>
					<X class="h-5 w-5" />
				</button>
			{/if}
		</div>

		<!-- Suggested Queries -->
		<div class="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
			<span class="text-cinema-text-muted">Popular searches:</span>
			{#each suggestedQueries as query (query)}
				<button
					type="button"
					onclick={() => setQuery(query)}
					class="rounded-md border border-cinema-border bg-cinema-surface px-2.5 py-1 text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated"
				>
					{query}
				</button>
			{/each}
		</div>
	</div>

	<!-- Results / Instructions Section -->
	<div class="mt-12">
		{#if searchQuery.trim() !== ''}
			<div class="mb-6 flex items-center justify-between border-b border-cinema-border pb-4">
				<h2 class="font-['Space_Grotesk'] text-lg font-semibold text-cinema-text">
					Search Results for "{searchQuery}"
				</h2>
				<span class="text-xs text-cinema-text-muted">
					{searchResults.length} match{searchResults.length === 1 ? '' : 'es'}
				</span>
			</div>

			{#if searchResults.length > 0}
				<MovieGrid movies={searchResults} />
			{:else}
				<EmptyState
					title="No Matching Movies"
					description="We could not find any titles matching your query in the current mock catalog. Try a different search term or explore all genres."
					actionHref="/explore"
					actionLabel="Browse Full Catalog"
				/>
			{/if}
		{:else}
			<!-- Idle / Coming Soon Notice for Phase 3 -->
			<div class="mx-auto max-w-xl">
				<EmptyState
					icon={Clapperboard}
					title="Instant Discovery"
					description="Type any keyword above to test instant matching against the Phase 1 catalog. Full server-side TMDB search and filters will arrive in Phase 3."
				/>
			</div>
		{/if}
	</div>
</div>
