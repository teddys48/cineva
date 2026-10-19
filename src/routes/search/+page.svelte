<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import type { Movie } from '#lib/types/movie';
	import type {
		SearchPerson,
		SearchCompany,
		ActiveFilterItem,
		SearchSuggestionsResponse
	} from '#lib/types/search';
	import MovieGrid from '#lib/components/movie/MovieGrid.svelte';
	import MovieCardSkeleton from '#lib/components/movie/MovieCardSkeleton.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import SectionError from '#lib/components/ui/SectionError.svelte';
	import Pagination from '#lib/components/ui/Pagination.svelte';
	import PersonResultCard from '#lib/components/search/PersonResultCard.svelte';
	import CompanyResultCard from '#lib/components/search/CompanyResultCard.svelte';
	import ActiveFilterChips from '#lib/components/search/ActiveFilterChips.svelte';
	import AdvancedFilterPanel, {
		type FilterState
	} from '#lib/components/search/AdvancedFilterPanel.svelte';
	import SearchSuggestionsDropdown, {
		type UnifiedSuggestion
	} from '#lib/components/search/SearchSuggestionsDropdown.svelte';
	import { personalizationState } from '#lib/personalization.svelte';
	import {
		Search,
		X,
		Clapperboard,
		Loader2,
		History,
		SlidersHorizontal,
		Users,
		Building2,
		Film,
		Sparkles
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	// Reactive search state
	let queryInput = $state('');
	let committedQuery = $state('');
	let currentPage = $state(1);
	let movies = $state<Movie[]>([]);
	let people = $state<SearchPerson[]>([]);
	let companies = $state<SearchCompany[]>([]);
	let activeFilters = $state<ActiveFilterItem[]>([]);
	let totalPages = $state(0);
	let totalResults = $state(0);
	let isLoading = $state(false);
	let searchError = $state<string | null>(null);

	// Filter state
	let isFilterPanelOpen = $state(false);
	let currentFilters = $state({
		genre: '',
		year: null as number | null,
		minRating: null as number | null,
		language: '',
		country: '',
		company: '',
		sortBy: 'popularity.desc'
	});

	// Suggestions dropdown state
	let isSuggestionsOpen = $state(false);
	let suggestionActiveIndex = $state(-1);
	let suggestionsData = $state<SearchSuggestionsResponse>({
		movies: [],
		people: [],
		discovery: []
	});

	// Async controllers
	let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
	let activeAbortController: AbortController | null = null;
	let suggestAbortController: AbortController | null = null;

	const suggestedQueries = [
		'Interstellar',
		'Christopher Nolan',
		'Cillian Murphy',
		'Greta Gerwig',
		'Dune 2024',
		'2024',
		'Japanese animation',
		'Sci-Fi',
		'Warner Bros.'
	];

	let recentQueries = $derived(personalizationState.searchHistory);

	// Sync when server data changes (e.g. browser back/forward or direct URL navigation)
	$effect(() => {
		queryInput = data.query || '';
		committedQuery = data.query || '';
		currentPage = data.page || 1;
		movies = data.movies || [];
		people = data.people || [];
		companies = data.companies || [];
		activeFilters = data.activeFilters || [];
		totalPages = data.totalPages || 0;
		totalResults = data.totalResults || 0;
		searchError = data.error || null;
		currentFilters = {
			genre: data.filters?.genre || '',
			year: data.filters?.year ?? null,
			minRating: data.filters?.minRating ?? null,
			language: data.filters?.language || '',
			country: data.filters?.country || '',
			company: data.filters?.company || '',
			sortBy: data.filters?.sortBy || 'popularity.desc'
		};

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
		if (suggestAbortController) suggestAbortController.abort();
	});

	function buildSearchUrl(term: string, pageNum = 1, filtersObj = currentFilters): string {
		const params = new SvelteURLSearchParams();
		const trimmed = term.trim();
		if (trimmed) params.set('query', trimmed);
		if (filtersObj.genre) params.set('genre', String(filtersObj.genre));
		if (filtersObj.year) params.set('year', String(filtersObj.year));
		if (filtersObj.minRating) params.set('minRating', String(filtersObj.minRating));
		if (filtersObj.language) params.set('language', filtersObj.language);
		if (filtersObj.country) params.set('country', filtersObj.country);
		if (filtersObj.company) params.set('company', String(filtersObj.company));
		if (filtersObj.sortBy && filtersObj.sortBy !== 'popularity.desc') {
			params.set('sortBy', filtersObj.sortBy);
		}
		if (pageNum > 1) params.set('page', String(pageNum));

		const q = params.toString();
		return q ? `/search?${q}` : '/search';
	}

	async function executeSearch(
		query: string,
		pageNum = 1,
		updateUrl = true,
		filtersOverride = currentFilters
	) {
		const trimmed = query.trim();
		const hasActiveFilters = Boolean(
			filtersOverride.genre ||
			filtersOverride.year ||
			filtersOverride.minRating ||
			filtersOverride.language ||
			filtersOverride.country ||
			filtersOverride.company
		);

		if (!trimmed && !hasActiveFilters) {
			committedQuery = '';
			movies = [];
			people = [];
			companies = [];
			activeFilters = [];
			totalPages = 0;
			totalResults = 0;
			searchError = null;
			isLoading = false;
			isSuggestionsOpen = false;
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
		isSuggestionsOpen = false;

		const targetUrl = buildSearchUrl(trimmed, pageNum, filtersOverride);

		if (updateUrl && typeof window !== 'undefined') {
			goto(targetUrl, { replaceState: false, reset: false });
		}

		try {
			const apiParams = new SvelteURLSearchParams();
			if (trimmed) apiParams.set('query', trimmed);
			if (filtersOverride.genre) apiParams.set('genre', String(filtersOverride.genre));
			if (filtersOverride.year) apiParams.set('year', String(filtersOverride.year));
			if (filtersOverride.minRating) apiParams.set('minRating', String(filtersOverride.minRating));
			if (filtersOverride.language) apiParams.set('language', filtersOverride.language);
			if (filtersOverride.country) apiParams.set('country', filtersOverride.country);
			if (filtersOverride.company) apiParams.set('company', String(filtersOverride.company));
			if (filtersOverride.sortBy) apiParams.set('sortBy', filtersOverride.sortBy);
			apiParams.set('page', String(pageNum));

			const res = await fetch(`/api/search?${apiParams.toString()}`, {
				signal: activeAbortController.signal
			});

			if (!res.ok) {
				throw new Error(`Search request failed with status ${res.status}`);
			}

			const result = await res.json();
			movies = result.movies || result.results || [];
			people = result.people || [];
			companies = result.companies || [];
			activeFilters = result.activeFilters || [];
			totalPages = result.totalPages || 0;
			totalResults = result.totalResults || 0;
			currentPage = result.page || pageNum;

			if (trimmed) {
				personalizationState.addSearchQuery(trimmed);
			}
		} catch (err: unknown) {
			if (err instanceof Error && err.name === 'AbortError') {
				return;
			}
			console.error('Client search error:', err);
			searchError = 'Unable to complete search request. Please try again.';
			movies = [];
			people = [];
			companies = [];
			totalPages = 0;
			totalResults = 0;
		} finally {
			isLoading = false;
		}
	}

	async function fetchSuggestions(term: string) {
		const trimmed = term.trim();
		if (trimmed.length < 2) {
			suggestionsData = { movies: [], people: [], discovery: [] };
			isSuggestionsOpen = false;
			suggestionActiveIndex = -1;
			return;
		}

		if (suggestAbortController) {
			suggestAbortController.abort();
		}
		suggestAbortController = new AbortController();

		try {
			const res = await fetch(`/api/search?suggest=true&query=${encodeURIComponent(trimmed)}`, {
				signal: suggestAbortController.signal
			});

			if (!res.ok) return;

			const data = (await res.json()) as SearchSuggestionsResponse;
			suggestionsData = data;
			const totalCount =
				(data.discovery?.length ?? 0) + (data.people?.length ?? 0) + (data.movies?.length ?? 0);
			isSuggestionsOpen = totalCount > 0;
			suggestionActiveIndex = -1;
		} catch (err: unknown) {
			if (err instanceof Error && err.name === 'AbortError') return;
			// Fail suggestions silently without disrupting user
		}
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		queryInput = target.value;

		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}

		if (!queryInput.trim()) {
			isSuggestionsOpen = false;
			suggestionActiveIndex = -1;
			executeSearch('', 1, true);
			return;
		}

		// 250ms debounce for live suggestions
		debounceTimeout = setTimeout(() => {
			fetchSuggestions(queryInput);
		}, 250);
	}

	function handleKeyDown(e: KeyboardEvent) {
		const flatCount =
			(suggestionsData.discovery?.length ?? 0) +
			(suggestionsData.people?.length ?? 0) +
			(suggestionsData.movies?.length ?? 0);

		if (isSuggestionsOpen && flatCount > 0) {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				suggestionActiveIndex = (suggestionActiveIndex + 1) % flatCount;
				return;
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				suggestionActiveIndex = (suggestionActiveIndex - 1 + flatCount) % flatCount;
				return;
			} else if (e.key === 'Escape') {
				e.preventDefault();
				isSuggestionsOpen = false;
				suggestionActiveIndex = -1;
				return;
			} else if (e.key === 'Enter' && suggestionActiveIndex >= 0) {
				e.preventDefault();
				selectHighlightedSuggestion();
				return;
			}
		}

		if (e.key === 'Enter') {
			if (debounceTimeout) clearTimeout(debounceTimeout);
			isSuggestionsOpen = false;
			executeSearch(queryInput, 1, true);
		}
	}

	function selectHighlightedSuggestion() {
		let idx = 0;
		for (const d of suggestionsData.discovery || []) {
			if (idx === suggestionActiveIndex) {
				handleSuggestionItemSelect({ kind: 'discovery', item: d });
				return;
			}
			idx++;
		}
		for (const p of suggestionsData.people || []) {
			if (idx === suggestionActiveIndex) {
				handleSuggestionItemSelect({ kind: 'person', item: p });
				return;
			}
			idx++;
		}
		for (const m of suggestionsData.movies || []) {
			if (idx === suggestionActiveIndex) {
				handleSuggestionItemSelect({ kind: 'movie', item: m });
				return;
			}
			idx++;
		}
	}

	function handleSuggestionItemSelect(suggestion: UnifiedSuggestion) {
		isSuggestionsOpen = false;
		suggestionActiveIndex = -1;

		if (suggestion.kind === 'movie') {
			goto(`/movie/${suggestion.item.id}`);
		} else if (suggestion.kind === 'person') {
			goto(`/person/${suggestion.item.id}`);
		} else if (suggestion.kind === 'discovery') {
			goto(suggestion.item.url);
		}
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (debounceTimeout) clearTimeout(debounceTimeout);
		isSuggestionsOpen = false;
		executeSearch(queryInput, 1, true);
	}

	function handleClear() {
		queryInput = '';
		isSuggestionsOpen = false;
		suggestionActiveIndex = -1;
		if (debounceTimeout) clearTimeout(debounceTimeout);
		executeSearch('', 1, true);
		const inputEl = document.getElementById('movie-search-input');
		if (inputEl) inputEl.focus();
	}

	function handleSuggestedClick(term: string) {
		queryInput = term;
		isSuggestionsOpen = false;
		if (debounceTimeout) clearTimeout(debounceTimeout);
		executeSearch(term, 1, true);
	}

	function handleRemoveRecent(e: MouseEvent, term: string) {
		e.stopPropagation();
		personalizationState.removeSearchQuery(term);
	}

	function handleRemoveFilter(filterKey: string) {
		const updated = { ...currentFilters };
		if (filterKey === 'genre') updated.genre = '';
		if (filterKey === 'year') updated.year = null;
		if (filterKey === 'minRating') updated.minRating = null;
		if (filterKey === 'language') updated.language = '';
		if (filterKey === 'country') updated.country = '';
		if (filterKey === 'company') updated.company = '';
		if (filterKey === 'sortBy') updated.sortBy = 'popularity.desc';

		currentFilters = updated;
		executeSearch(queryInput, 1, true, updated);
	}

	function handleClearAllFilters() {
		currentFilters = {
			genre: '',
			year: null,
			minRating: null,
			language: '',
			country: '',
			company: '',
			sortBy: 'popularity.desc'
		};
		executeSearch(queryInput, 1, true, currentFilters);
	}

	function handleApplyFilters(newFilters: FilterState) {
		currentFilters = {
			genre: newFilters.genre || '',
			year: newFilters.year ?? null,
			minRating: newFilters.minRating ?? null,
			language: newFilters.language || '',
			country: newFilters.country || '',
			company: newFilters.company ? String(newFilters.company) : '',
			sortBy: newFilters.sortBy || 'popularity.desc'
		};
		isFilterPanelOpen = false;
		executeSearch(queryInput, 1, true, currentFilters);
	}

	function handleResetFilters() {
		handleClearAllFilters();
	}

	function handlePageSelect(targetPage: number) {
		executeSearch(committedQuery, targetPage, true);
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 180, behavior: 'smooth' });
		}
	}

	function getSearchPageUrl(p: number): string {
		return buildSearchUrl(committedQuery, p, currentFilters);
	}

	let activeFilterCount = $derived(
		(currentFilters.genre ? 1 : 0) +
			(currentFilters.year ? 1 : 0) +
			(currentFilters.minRating ? 1 : 0) +
			(currentFilters.language ? 1 : 0) +
			(currentFilters.country ? 1 : 0) +
			(currentFilters.company ? 1 : 0) +
			(currentFilters.sortBy && currentFilters.sortBy !== 'popularity.desc' ? 1 : 0)
	);

	let canonicalUrl = $derived(page.url.href);
	let metaDescription = $derived(
		committedQuery
			? `Search results for "${committedQuery}" across films, creators, and cinema discovery on Cineva.`
			: 'Search cinema titles, directors, actors, genres, and metadata on Cineva.'
	);
</script>

<svelte:head>
	<title
		>{committedQuery
			? `"${committedQuery}" — Search Cineva`
			: 'Search Cineva — Find your next favorite'}</title
	>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={canonicalUrl} />

	{#if committedQuery}
		<meta name="robots" content="noindex, follow" />
	{/if}

	<meta property="og:site_name" content="Cineva" />
	<meta
		property="og:title"
		content={committedQuery
			? `"${committedQuery}" — Search Cineva`
			: 'Search Cineva — Find your next favorite'}
	/>
	<meta property="og:description" content={metaDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonicalUrl} />

	<meta name="twitter:card" content="summary" />
	<meta
		name="twitter:title"
		content={committedQuery
			? `"${committedQuery}" — Search Cineva`
			: 'Search Cineva — Find your next favorite'}
	/>
	<meta name="twitter:description" content={metaDescription} />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Search Header and Input Area -->
	<div class="mx-auto max-w-2xl text-center">
		<div
			class="inline-flex items-center gap-2 rounded-full border border-cinema-border bg-cinema-surface px-3 py-1 text-xs font-semibold text-cinema-accent shadow-xs"
		>
			<Sparkles class="h-3.5 w-3.5" />
			<span>UNIFIED DISCOVERY</span>
		</div>
		<h1
			class="mt-3 font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-cinema-text sm:text-4xl"
		>
			Search Cineva
		</h1>
		<p class="mt-2 text-sm text-cinema-text-muted">
			Find films, creators, genres, years, and production companies across the global cinema
			catalog.
		</p>

		<!-- Search Input Form with Live Suggestions -->
		<div class="relative mt-6 text-left">
			<form onsubmit={handleSubmit} role="search" class="relative">
				<label for="movie-search-input" class="sr-only"
					>Search movies, people, genres, or years</label
				>
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
					onkeydown={handleKeyDown}
					onfocus={() => {
						if (queryInput.trim().length >= 2) fetchSuggestions(queryInput);
					}}
					placeholder="Search movies, directors, actors, genres (e.g. Nolan, Dune 2024, Sci-Fi)..."
					autocomplete="off"
					spellcheck="false"
					role="combobox"
					aria-expanded={isSuggestionsOpen}
					aria-autocomplete="list"
					aria-controls="search-suggestions-menu"
					class="w-full rounded-2xl border border-cinema-border bg-cinema-surface py-4 pr-24 pl-12 text-sm text-cinema-text placeholder-cinema-text-muted shadow-sm transition-all focus:border-cinema-accent focus:bg-cinema-elevated focus:ring-1 focus:ring-cinema-accent focus:outline-none"
				/>

				<div class="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-3">
					{#if queryInput}
						<button
							type="button"
							onclick={handleClear}
							class="flex h-7 w-7 items-center justify-center rounded-lg text-cinema-text-muted transition-colors hover:bg-cinema-elevated hover:text-cinema-text focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
							aria-label="Clear search query"
						>
							<X class="h-4 w-4" />
						</button>
					{/if}

					<!-- Filter Toggle Button -->
					<button
						type="button"
						onclick={() => (isFilterPanelOpen = !isFilterPanelOpen)}
						class="flex h-8 items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-elevated px-2.5 text-xs font-medium text-cinema-text transition-colors hover:border-cinema-accent/40 hover:text-cinema-accent focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none {activeFilterCount >
						0
							? 'border-cinema-accent text-cinema-accent'
							: ''}"
						aria-expanded={isFilterPanelOpen}
						aria-label="Toggle advanced filters"
						title="Toggle discovery filters"
					>
						<SlidersHorizontal class="h-3.5 w-3.5" />
						<span class="hidden sm:inline">Filters</span>
						{#if activeFilterCount > 0}
							<span
								class="flex h-4 min-w-4 items-center justify-center rounded-full bg-cinema-accent px-1 font-mono text-[10px] font-bold text-cinema-accent-foreground"
							>
								{activeFilterCount}
							</span>
						{/if}
					</button>
				</div>
			</form>

			<!-- Live Grouped Suggestions Dropdown -->
			<SearchSuggestionsDropdown
				suggestions={suggestionsData}
				isOpen={isSuggestionsOpen}
				activeIndex={suggestionActiveIndex}
				onSelect={handleSuggestionItemSelect}
				onClose={() => (isSuggestionsOpen = false)}
			/>
		</div>

		<!-- Advanced Filters Panel (Collapsible) -->
		<AdvancedFilterPanel
			isOpen={isFilterPanelOpen}
			filters={currentFilters}
			genres={data.genres || []}
			onApply={handleApplyFilters}
			onReset={handleResetFilters}
			onClose={() => (isFilterPanelOpen = false)}
		/>

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
							onclick={() => handleSuggestedClick(recent)}
							class="text-xs font-medium text-cinema-text hover:text-cinema-accent focus-visible:outline-none"
						>
							{recent}
						</button>
						<button
							type="button"
							onclick={(e) => handleRemoveRecent(e, recent)}
							class="flex h-4 w-4 items-center justify-center rounded text-cinema-text-muted hover:text-cinema-text focus-visible:outline-none"
							aria-label={`Remove '${recent}' from search history`}
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
			<span class="text-cinema-text-muted">Discover:</span>
			{#each suggestedQueries as suggestion (suggestion)}
				<button
					type="button"
					onclick={() => handleSuggestedClick(suggestion)}
					class="rounded-md border border-cinema-border bg-cinema-surface px-2.5 py-1 text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
				>
					{suggestion}
				</button>
			{/each}
		</div>
	</div>

	<!-- Active Filters Chips -->
	{#if activeFilters.length > 0}
		<div class="mt-8">
			<ActiveFilterChips
				items={activeFilters}
				onRemove={handleRemoveFilter}
				onClear={handleClearAllFilters}
			/>
		</div>
	{/if}

	<!-- Results / Empty / Error / Loading Content -->
	<div class="mt-10">
		{#if searchError}
			<SectionError
				title="Search Error"
				message={searchError}
				onretry={() => executeSearch(committedQuery || queryInput, currentPage, false)}
			/>
		{:else if isLoading && movies.length === 0 && people.length === 0}
			<!-- Loading Skeletons -->
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
				{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as skeletonId (skeletonId)}
					<MovieCardSkeleton />
				{/each}
			</div>
		{:else if (committedQuery || activeFilters.length > 0) && movies.length === 0 && people.length === 0 && companies.length === 0 && !isLoading}
			<!-- Empty State -->
			<EmptyState
				icon={Clapperboard}
				title={committedQuery
					? `No results found for "${committedQuery}"`
					: 'No titles match the selected discovery filters'}
				description="We couldn't locate any matching films or people with the current criteria. Try adjusting your spelling, clearing a filter, or exploring by popular genres."
				actionHref="/explore"
				actionLabel="Explore All Movies"
			/>
		{:else if movies.length > 0 || people.length > 0 || companies.length > 0}
			<!-- Results Header -->
			<div
				class="mb-8 flex flex-col gap-2 border-b border-cinema-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<div>
					{#if committedQuery}
						<p class="text-xs font-medium text-cinema-text-muted">
							Showing results for <span class="font-semibold text-cinema-text"
								>"{committedQuery}"</span
							>
						</p>
					{:else if activeFilters.length > 0}
						<p class="text-xs font-medium text-cinema-text-muted">Filtered Discovery Results</p>
					{/if}
					{#if totalResults > 0}
						<p class="mt-0.5 text-xs text-cinema-text-muted">
							Found {new Intl.NumberFormat('en-US').format(totalResults)} matching title{totalResults ===
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

			<!-- 1. People Section (Distinct from Movie Grids) -->
			{#if people.length > 0}
				<section class="mb-12" aria-label="People Results">
					<div class="mb-4 flex items-center gap-2">
						<div
							class="flex h-7 w-7 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface text-cinema-accent"
						>
							<Users class="h-4 w-4" />
						</div>
						<h2 class="font-['Space_Grotesk'] text-lg font-bold text-cinema-text sm:text-xl">
							People ({people.length})
						</h2>
					</div>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						{#each people as person (person.id)}
							<PersonResultCard {person} />
						{/each}
					</div>
				</section>
			{/if}

			<!-- 2. Production Companies Section (If matched) -->
			{#if companies.length > 0}
				<section class="mb-12" aria-label="Production Company Results">
					<div class="mb-4 flex items-center gap-2">
						<div
							class="flex h-7 w-7 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface text-cinema-accent"
						>
							<Building2 class="h-4 w-4" />
						</div>
						<h2 class="font-['Space_Grotesk'] text-lg font-bold text-cinema-text sm:text-xl">
							Production Companies
						</h2>
					</div>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						{#each companies as company (company.id)}
							<CompanyResultCard {company} />
						{/each}
					</div>
				</section>
			{/if}

			<!-- 3. Movies Section -->
			{#if movies.length > 0}
				<section aria-label="Movie Results">
					{#if people.length > 0 || companies.length > 0}
						<div class="mb-4 flex items-center gap-2">
							<div
								class="flex h-7 w-7 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface text-cinema-accent"
							>
								<Film class="h-4 w-4" />
							</div>
							<h2 class="font-['Space_Grotesk'] text-lg font-bold text-cinema-text sm:text-xl">
								Movies
							</h2>
						</div>
					{/if}

					<!-- Reusable Movie Grid -->
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
				</section>
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
					Discover the Cinema Universe
				</h2>
				<p class="mt-2 max-w-md text-xs leading-relaxed text-cinema-text-muted sm:text-sm">
					Search over 700,000 films and creators by title, person name, year, genre, language, or
					production company.
				</p>
			</div>
		{/if}
	</div>
</div>
