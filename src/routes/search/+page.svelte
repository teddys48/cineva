<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import type { Movie } from '#lib/types/movie';
	import MovieGrid from '#lib/components/movie/MovieGrid.svelte';
	import MovieCardSkeleton from '#lib/components/movie/MovieCardSkeleton.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import SectionError from '#lib/components/ui/SectionError.svelte';
	import Pagination from '#lib/components/ui/Pagination.svelte';
	import { personalizationState } from '#lib/personalization.svelte';
	import { Search, X, Clapperboard, Loader2, History } from 'lucide-svelte';

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

	let recentQueries = $derived(personalizationState.searchHistory);

	// Sync when server data changes (e.g. browser back/forward or direct navigation)
	$effect(() => {
		queryInput = data.query || '';
		committedQuery = data.query || '';
		currentPage = data.page || 1;
		movies = data.movies || [];
		totalPages = data.totalPages || 0;
		totalResults = data.totalResults || 0;
		searchError = data.error || null;

		const searchQuery = data.query?.trim();
		if (searchQuery) {
			untrack(() => {
				personalizationState.addSearchQuery(searchQuery);
			});
		}
	});

	onDestroy(() => {
		if (debounceTimeout) clearTimeout(debounceTimeout);
		if (activeAbortController) activeAbortController.abort();
	});

	async function executeSearch(query: string, pageNum = 1, updateUrl = true) {
		const trimmed = query.trim();

		if (!trimmed) {
			committedQuery = '';
			movies = [];
			totalPages = 0;
			totalResults = 0;
			searchError = null;
			isLoading = false;
			if (updateUrl && typeof window !== 'undefined') {
				goto('/search', { replaceState: true, reset: false });
			}
			return;
		}

		if (activeAbortController) {
			activeAbortController.abort();
		}
		activeAbortController = new AbortController();

		isLoading = true;
		searchError = null;
		committedQuery = trimmed;
		currentPage = pageNum;

		if (updateUrl && typeof window !== 'undefined') {
			const searchUrl = `/search?query=${encodeURIComponent(trimmed)}${pageNum > 1 ? `&page=${pageNum}` : ''}`;
			goto(searchUrl, { replaceState: false, reset: false });
		}

		try {
			const res = await fetch(`/api/search?query=${encodeURIComponent(trimmed)}&page=${pageNum}`, {
				signal: activeAbortController.signal
			});

			if (!res.ok) {
				throw new Error(`Search request failed with status ${res.status}`);
			}

			const result = await res.json();
			movies = result.results || [];
			totalPages = result.totalPages || 0;
			totalResults = result.totalResults || 0;
			currentPage = result.page || pageNum;

			// Add successfully executed query to user history
			personalizationState.addSearchQuery(trimmed);
		} catch (err: unknown) {
			if (err instanceof Error && err.name === 'AbortError') {
				return;
			}
			console.error('Client search error:', err);
			searchError = 'Unable to complete search request. Please try again.';
			movies = [];
			totalPages = 0;
			totalResults = 0;
		} finally {
			isLoading = false;
		}
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		queryInput = target.value;

		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}

		// Instant clear if empty
		if (!queryInput.trim()) {
			executeSearch('', 1, true);
			return;
		}

		// 300ms debounce for live typing search
		debounceTimeout = setTimeout(() => {
			executeSearch(queryInput, 1, true);
		}, 300);
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}
		executeSearch(queryInput, 1, true);
	}

	function handleClear() {
		queryInput = '';
		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}
		executeSearch('', 1, true);
		const inputEl = document.getElementById('movie-search-input');
		if (inputEl) inputEl.focus();
	}

	function handleSuggestionClick(term: string) {
		queryInput = term;
		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}
		executeSearch(term, 1, true);
	}

	function handleRemoveRecent(e: MouseEvent, term: string) {
		e.stopPropagation();
		personalizationState.removeSearchQuery(term);
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

	let canonicalUrl = $derived(page.url.href);
	let metaDescription = $derived(
		committedQuery
			? `Search results for "${committedQuery}" across the TMDB catalog on Scenora.`
			: 'Search cinema titles across the TMDB catalog with instant live search on Scenora.'
	);
</script>

<svelte:head>
	<title
		>{committedQuery
			? `"${committedQuery}" — Search Scenora`
			: 'Search Scenora — Find your next favorite'}</title
	>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={canonicalUrl} />

	{#if committedQuery}
		<!-- Avoid search engine indexing of arbitrary query combinations -->
		<meta name="robots" content="noindex, follow" />
	{/if}

	<!-- Open Graph / Social Sharing -->
	<meta property="og:site_name" content="Scenora" />
	<meta
		property="og:title"
		content={committedQuery
			? `"${committedQuery}" — Search Scenora`
			: 'Search Scenora — Find your next favorite'}
	/>
	<meta property="og:description" content={metaDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonicalUrl} />

	<!-- Twitter Cards -->
	<meta name="twitter:card" content="summary" />
	<meta
		name="twitter:title"
		content={committedQuery
			? `"${committedQuery}" — Search Scenora`
			: 'Search Scenora — Find your next favorite'}
	/>
	<meta name="twitter:description" content={metaDescription} />
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
			Search Scenora
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

		<!-- Recent Searches Section (Lightweight Personalization) -->
		{#if recentQueries.length > 0}
			<div class="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
				<div class="flex items-center gap-1 text-cinema-text-muted">
					<History class="h-3.5 w-3.5 text-cinema-accent" />
					<span>Recent:</span>
				</div>
				{#each recentQueries as recent (recent)}
					<div
						class="inline-flex items-center gap-1 rounded-md border border-cinema-border bg-cinema-surface py-0.5 pr-1 pl-2 text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated"
					>
						<button
							type="button"
							onclick={() => handleSuggestionClick(recent)}
							class="text-xs font-medium text-cinema-text hover:text-cinema-accent focus-visible:outline-none"
						>
							{recent}
						</button>
						<button
							type="button"
							onclick={(e) => handleRemoveRecent(e, recent)}
							class="flex h-4 w-4 items-center justify-center rounded text-cinema-text-muted hover:text-cinema-text focus-visible:outline-none"
							aria-label="Remove '{recent}' from search history"
							title="Remove from history"
						>
							<X class="h-3 w-3" />
						</button>
					</div>
				{/each}
				<button
					type="button"
					onclick={() => personalizationState.clearSearchHistory()}
					class="ml-1 text-[11px] text-cinema-text-muted transition-colors hover:text-red-400 focus-visible:outline-none"
					title="Clear all recent searches"
				>
					Clear
				</button>
			</div>
		{/if}

		<!-- Suggested Queries -->
		<div class="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
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
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
				{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as skeletonId (skeletonId)}
					<MovieCardSkeleton />
				{/each}
			</div>
		{:else if committedQuery && movies.length === 0 && !isLoading}
			<!-- Empty Results State -->
			<EmptyState
				icon={Clapperboard}
				title={`No movies found for "${committedQuery}"`}
				description="We couldn't locate any matching titles in the TMDB catalog. Check your spelling or try another cinematic search term."
				actionHref="/explore"
				actionLabel="Explore All Movies"
			/>
		{:else if movies.length > 0}
			<!-- Active Search Results Header -->
			<div
				class="mb-6 flex flex-col gap-2 border-b border-cinema-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<div>
					<p class="text-xs font-medium text-cinema-text-muted">
						Showing results for <span class="font-semibold text-cinema-text"
							>"{committedQuery}"</span
						>
					</p>
					{#if totalResults > 0}
						<p class="mt-0.5 text-xs text-cinema-text-muted">
							Found {new Intl.NumberFormat('en-US').format(totalResults)} matching film{totalResults ===
							1
								? ''
								: 's'}
						</p>
					{/if}
				</div>

				{#if totalPages > 1}
					<div class="text-xs text-cinema-text-muted">
						Page <span class="font-semibold text-cinema-text">{currentPage}</span> of
						<span class="font-semibold text-cinema-text">{totalPages}</span>
					</div>
				{/if}
			</div>

			<!-- Search Results Grid -->
			<MovieGrid {movies} />

			<!-- Pagination Controls -->
			{#if totalPages > 1}
				<div class="mt-12">
					<Pagination
						{currentPage}
						{totalPages}
						getPageUrl={getSearchPageUrl}
						onPageSelect={handlePageSelect}
					/>
				</div>
			{/if}
		{:else}
			<!-- Initial Search Idle State -->
			<div
				class="flex flex-col items-center justify-center rounded-2xl border border-cinema-border/50 bg-cinema-surface/30 p-12 text-center"
			>
				<div
					class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cinema-border bg-cinema-elevated text-cinema-accent"
				>
					<Search class="h-7 w-7" />
				</div>
				<h2 class="font-['Space_Grotesk'] text-lg font-bold text-cinema-text sm:text-xl">
					Type to Search the Catalog
				</h2>
				<p class="mt-2 max-w-md text-xs leading-relaxed text-cinema-text-muted sm:text-sm">
					Search over 700,000 films by title, franchise, or keyword. Results update in real-time as
					you type.
				</p>
			</div>
		{/if}
	</div>
</div>
