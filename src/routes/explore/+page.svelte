<script lang="ts">
	import { page } from '$app/state';
	import MovieGrid from '#lib/components/movie/MovieGrid.svelte';
	import { MOCK_MOVIES, GENRES } from '#lib/data/mock-movies';
	import { Compass, SlidersHorizontal } from 'lucide-svelte';

	// Read selected genre from query parameter if present
	let selectedGenre = $state<string>('all');

	$effect(() => {
		const param = page.url.searchParams.get('genre');
		if (param) {
			selectedGenre = param.toLowerCase();
		} else {
			selectedGenre = 'all';
		}
	});

	let filteredMovies = $derived(
		selectedGenre === 'all'
			? MOCK_MOVIES
			: MOCK_MOVIES.filter((m) =>
					m.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
				)
	);
</script>

<svelte:head>
	<title>Explore Cinema - Cineva</title>
	<meta
		name="description"
		content="Explore curated films across genres, directors, and eras in the Cineva catalog."
	/>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Page Header -->
	<div class="border-b border-cinema-border pb-6">
		<div class="flex items-center gap-2 text-xs font-semibold tracking-wider text-cinema-accent">
			<Compass class="h-4 w-4" />
			<span>CURATED CATALOG</span>
		</div>
		<h1
			class="mt-2 font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-cinema-text sm:text-4xl"
		>
			Explore Cinema
		</h1>
		<p class="mt-2 max-w-2xl text-sm leading-relaxed text-cinema-text-muted">
			Browse through our curated collection of contemporary releases, timeless classics, and
			visionary independent films.
		</p>

		<!-- Genre Filter Pills -->
		<div class="mt-6 flex flex-wrap items-center gap-2">
			<button
				type="button"
				onclick={() => (selectedGenre = 'all')}
				class="rounded-full px-3.5 py-1.5 text-xs font-medium shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none {selectedGenre ===
				'all'
					? 'bg-cinema-accent font-semibold text-cinema-accent-foreground'
					: 'border border-cinema-border bg-cinema-surface text-cinema-text-muted hover:bg-cinema-elevated hover:text-cinema-text'}"
			>
				All Genres ({MOCK_MOVIES.length})
			</button>

			{#each GENRES as genre (genre.id)}
				<button
					type="button"
					onclick={() => (selectedGenre = genre.slug)}
					class="rounded-full px-3.5 py-1.5 text-xs font-medium shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none {selectedGenre ===
					genre.slug
						? 'bg-cinema-accent font-semibold text-cinema-accent-foreground'
						: 'border border-cinema-border bg-cinema-surface text-cinema-text-muted hover:bg-cinema-elevated hover:text-cinema-text'}"
				>
					{genre.name}
				</button>
			{/each}
		</div>
	</div>

	<!-- Results Stats and Filter Bar -->
	<div class="flex items-center justify-between py-6">
		<p class="text-xs text-cinema-text-muted">
			Showing <span class="font-mono font-medium text-cinema-text">{filteredMovies.length}</span> curated
			titles
		</p>
		<div class="flex items-center gap-2 text-xs text-cinema-text-muted">
			<SlidersHorizontal class="h-3.5 w-3.5 text-cinema-accent" />
			<span>Phase 1 Mock Dataset</span>
		</div>
	</div>

	<!-- Movie Grid -->
	{#if filteredMovies.length > 0}
		<MovieGrid movies={filteredMovies} />
	{:else}
		<div class="py-16 text-center">
			<p class="text-sm text-cinema-text-muted">No titles found in this category.</p>
			<button
				type="button"
				onclick={() => (selectedGenre = 'all')}
				class="mt-4 rounded-lg border border-cinema-border bg-cinema-surface px-4 py-2 text-xs font-medium text-cinema-text shadow-xs hover:border-cinema-accent/40 hover:bg-cinema-elevated"
			>
				Reset Filter
			</button>
		</div>
	{/if}
</div>
