<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Movie } from '#lib/types/movie';
	import MovieGrid from '#lib/components/movie/MovieGrid.svelte';
	import MovieCardSkeleton from '#lib/components/movie/MovieCardSkeleton.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import SectionError from '#lib/components/ui/SectionError.svelte';
	import Pagination from '#lib/components/ui/Pagination.svelte';
	import { Search, X, Clapperboard, Loader2 } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let queryInput = $state('');
	let committedQuery = $state('');
	let currentPage = $state(1);
	let movies = $state<Movie[]>([]);
	let totalPages = $state(0);
	let totalResults = $state(0);
	let isLoading = $state(false);
	let searchError = $state<string | null>(null);

	let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
	let activeAbortController: AbortController | null = null;

	const suggestedQueries = [
		'Interstellar',
		'Blade Runner',
		'Oppenheimer',
		'Dune',
		'Spirited Away',
		'Cyberpunk',
		'Animation'
	];

	// Sync when server data changes (e.g. browser back/forward or direct navigation)
	$effect(() => {
		queryInput = data.query || '';
		committedQuery = data.query || '';
		currentPage = data.page || 1;
		movies = data.movies || [];
		totalPages = data.totalPages || 0;
		totalResults = data.totalResults || 0;
		searchError = data.error || null;
	});

	onDestroy(() => {
		if (debounceTimeout) clearTimeout(debounceTimeout);
		if (activeAbortController) activeAbortController.abort();
	});

	async function executeSearch(query: string, page: number = 1, replaceState: boolean = true) {
		const trimmed = query.trim();

		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
			debounceTimeout = null;
		}

		if (!trimmed) {
			if (activeAbortController) activeAbortController.abort();
			isLoading = false;
			movies = [];
			committedQuery = '';
			currentPage = 1;
			totalPages = 0;
			totalResults = 0;
			searchError = null;
			goto('/search', { replace: true, reset: false });
			return;
		}

		if (activeAbortController) {
			activeAbortController.abort();
		}

		activeAbortController = new AbortController();
		isLoading = true;
		searchError = null;

		try {
			const res = await fetch(`/api/search?query=${encodeURIComponent(trimmed)}&page=${page}`, {
				signal: activeAbortController.signal,
				headers: {
					Accept: 'application/json'
				}
			});

			if (!res.ok) {
				const errJson = await res.json().catch(() => ({}));
				throw new Error(errJson.error || `Search failed with status ${res.status}`);
			}

			const json = await res.json();
			movies = json.results || [];
			totalPages = json.totalPages || 0;
			totalResults = json.totalResults || 0;
			committedQuery = trimmed;
			currentPage = page;

			// Sync URL state without triggering an unnecessary full navigation
			const targetUrl =
				page > 1
					? `/search?query=${encodeURIComponent(trimmed)}&page=${page}`
					: `/search?query=${encodeURIComponent(trimmed)}`;

			goto(targetUrl, {
				replace: replaceState,
				reset: page !== 1
			});
		} catch (err: unknown) {
			if (err instanceof Error && err.name === 'AbortError') {
				// Aborted by a newer query or user action; disregard cleanly
				return;
			}
			searchError =
				err instanceof Error ? err.message : 'Unable to complete search request. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = target.value;
		queryInput = val;

		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}

		const trimmed = val.trim();
		if (!trimmed) {
			executeSearch('', 1, true);
			return;
		}

		isLoading = true;
		debounceTimeout = setTimeout(() => {
			executeSearch(trimmed, 1, true);
		}, 350);
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const trimmed = queryInput.trim();
		if (trimmed) {
			executeSearch(trimmed, 1, false);
		}
	}

	function handleClear() {
		queryInput = '';
		executeSearch('', 1, true);
	}

	function handleSuggestionClick(term: string) {
		queryInput = term;
		executeSearch(term, 1, false);
	}

	function handlePageSelect(targetPage: number) {
		if (committedQuery) {
			executeSearch(committedQuery, targetPage, false);
			window.scrollTo({ top: 180, behavior: 'smooth' });
		}
	}

	function getSearchPageUrl(p: number): string {
		return `/search?query=${encodeURIComponent(committedQuery)}${p > 1 ? `&page=${p}` : ''}`;
	}
</script>

<svelte:head>
	<title
		>{committedQuery
			? `"${committedQuery}" - Search Cineva`
			: 'Search Cineva — Find your next favorite'}</title
	>
	<meta
		name="description"
		content="Search cinema titles across the TMDB catalog with instant live search in Cineva."
	/>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Search Header and Input -->
	<div class="mx-auto max-w-2xl text-center">
		<div
			class="inline-flex items-center gap-2 rounded-full border border-cinema-border bg-cinema-surface px-3 py-1 text-xs font-semibold text-cinema-accent shadow-xs"
		>
			<Search class="h-3.5 w-3.5" />
			<span>SEARCH CINEMA</span>
		</div>
		<h1
			class="mt-3 font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-cinema-text sm:text-4xl"
		>
			Search Cineva
		</h1>
		<p class="mt-2 text-sm text-cinema-text-muted">
			Find films by title across the official TMDB catalog with real-time matching.
		</p>

		<!-- Search Input Form -->
		<form onsubmit={handleSubmit} class="relative mt-6" role="search">
			<label for="movie-search-input" class="sr-only">Search movies by title</label>
			<div
				class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-cinema-text-muted"
			>
				{#if isLoading}
					<Loader2 class="h-5 w-5 animate-spin text-cinema-accent" />
				{:else}
					<Search class="h-5 w-5 text-cinema-accent" />
				{/if}
			</div>

			<input
				id="movie-search-input"
				type="search"
				value={queryInput}
				oninput={handleInput}
				placeholder="Search movies by title (e.g. Interstellar, Dune)..."
				autocomplete="off"
				spellcheck="false"
				class="w-full rounded-2xl border border-cinema-border bg-cinema-surface py-4 pr-12 pl-12 text-sm text-cinema-text placeholder-cinema-text-muted shadow-sm transition-all focus:border-cinema-accent focus:bg-cinema-elevated focus:ring-1 focus:ring-cinema-accent focus:outline-none"
			/>

			{#if queryInput}
				<button
					type="button"
					onclick={handleClear}
					class="absolute inset-y-0 right-0 flex items-center pr-4 text-cinema-text-muted transition-colors hover:text-cinema-text focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
					aria-label="Clear search query"
				>
					<X class="h-5 w-5" />
				</button>
			{/if}
		</form>

		<!-- Suggested Queries -->
		<div class="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
			<span class="text-cinema-text-muted">Popular searches:</span>
			{#each suggestedQueries as suggestion (suggestion)}
				<button
					type="button"
					onclick={() => handleSuggestionClick(suggestion)}
					class="rounded-md border border-cinema-border bg-cinema-surface px-2.5 py-1 text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
				>
					{suggestion}
				</button>
			{/each}
		</div>
	</div>

	<!-- Results / Instructions Section -->
	<div class="mt-12">
		{#if searchError}
			<SectionError
				title="Search Error"
				message={searchError}
				onretry={() => executeSearch(committedQuery || queryInput, currentPage, false)}
			/>
		{:else if isLoading && movies.length === 0}
			<!-- Loading Skeleton State when no results currently exist -->
			<div class="mb-6 flex items-center justify-between border-b border-cinema-border pb-4">
				<span class="text-xs text-cinema-text-muted">Searching TMDB database...</span>
			</div>
			<div
				class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5"
				aria-busy="true"
				aria-live="polite"
			>
				{#each Array.from({ length: 10 }, (_, idx) => idx) as idx (idx)}
					<MovieCardSkeleton />
				{/each}
			</div>
		{:else if committedQuery.trim() !== ''}
			<div class="mb-6 flex items-center justify-between border-b border-cinema-border pb-4">
				<h2 class="font-['Space_Grotesk'] text-lg font-semibold text-cinema-text">
					Results for "{committedQuery}"
				</h2>
				<span class="text-xs text-cinema-text-muted">
					{#if totalResults > 0}
						Showing page <span class="font-mono text-cinema-text">{currentPage}</span> of
						<span class="font-mono text-cinema-text">{Math.min(500, totalPages)}</span>
						({totalResults.toLocaleString()}
						{totalResults === 1 ? 'title' : 'titles'} found)
					{:else}
						0 titles found
					{/if}
				</span>
			</div>

			{#if movies.length > 0}
				<div class="relative">
					{#if isLoading}
						<div
							class="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-cinema-bg/60 backdrop-blur-xs"
							aria-busy="true"
						>
							<div
								class="flex items-center gap-2 rounded-lg border border-cinema-border bg-cinema-surface px-4 py-2 text-xs font-medium text-cinema-text shadow-lg"
							>
								<Loader2 class="h-4 w-4 animate-spin text-cinema-accent" />
								<span>Updating results...</span>
							</div>
						</div>
					{/if}
					<MovieGrid {movies} />
				</div>

				<!-- Pagination Controls -->
				<Pagination
					{currentPage}
					{totalPages}
					getPageUrl={getSearchPageUrl}
					onPageSelect={handlePageSelect}
				/>
			{:else}
				<EmptyState
					title="No Matching Films"
					description="We couldn't find any films matching &quot;{committedQuery}&quot;. Check the spelling, try broader keywords, or browse through our curated catalog."
					actionHref="/explore"
					actionLabel="Explore All Genres"
				/>
			{/if}
		{:else}
			<!-- Idle / Search Initiation Prompt -->
			<div class="mx-auto max-w-xl">
				<EmptyState
					icon={Clapperboard}
					title="Discover Cinema"
					description="Search across thousands of titles in TMDB. Enter a movie title or choose one of the popular recommendations above."
					actionHref="/explore"
					actionLabel="Browse Curated Explore"
				/>
			</div>
		{/if}
	</div>
</div>
