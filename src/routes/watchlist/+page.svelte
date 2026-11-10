<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { page } from '$app/state';
	import MovieCard from '#lib/components/movie/MovieCard.svelte';
	import TVCard from '#lib/components/tv/TVCard.svelte';
	import MovieCardSkeleton from '#lib/components/movie/MovieCardSkeleton.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import {
		watchlistState,
		watchlistItemToMovie,
		watchlistItemToTVShow
	} from '#lib/watchlist.svelte';
	import type {
		WatchlistSortOption,
		WatchlistContentTypeFilter
	} from '#lib/types/watchlist';
	import {
		Bookmark,
		Trash2,
		ArrowUpDown,
		SlidersHorizontal,
		AlertTriangle,
		Film,
		Tv,
		Layers,
		Check,
		X
	} from 'lucide-svelte';

	let sortBy = $state<WatchlistSortOption>('date_added_desc');
	let contentTypeFilter = $state<WatchlistContentTypeFilter>('all');
	let selectedGenre = $state<string>('all');
	let isConfirmingClear = $state(false);

	let isInitialized = $derived(watchlistState.isInitialized);
	let storageAvailable = $derived(watchlistState.storageAvailable);
	let allSaved = $derived(watchlistState.items);
	let totalCount = $derived(watchlistState.count);
	let movieCount = $derived(watchlistState.movieCount);
	let tvCount = $derived(watchlistState.tvCount);

	// Items filtered by content type (before genre filtering)
	let contentTypeItems = $derived.by(() => {
		if (contentTypeFilter === 'all') return allSaved;
		return allSaved.filter((item) => item.mediaType === contentTypeFilter);
	});

	// Extract unique genres present across items in the active content type
	let availableGenres = $derived.by(() => {
		const set = new SvelteSet<string>();
		for (const item of contentTypeItems) {
			if (item.genres) {
				for (const g of item.genres) {
					if (g) set.add(g);
				}
			}
		}
		return Array.from(set).sort();
	});

	// Client-side filtering & sorting of saved items
	let displayedItems = $derived.by(() => {
		let list = watchlistState.getSortedItems(sortBy, contentTypeFilter);
		if (selectedGenre !== 'all') {
			list = list.filter((m) => m.genres && m.genres.includes(selectedGenre));
		}
		return list;
	});

	function handleSortChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		sortBy = target.value as WatchlistSortOption;
	}

	function handleGenreChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		selectedGenre = target.value;
	}

	function handleContentTypeChange(filter: WatchlistContentTypeFilter) {
		contentTypeFilter = filter;
		selectedGenre = 'all'; // Reset genre when switching content type
	}

	function handleClearAll() {
		watchlistState.clear();
		isConfirmingClear = false;
	}

	let canonicalUrl = $derived(page.url.href);
	const metaDescription =
		'Manage and explore your personal saved movies and TV series on Cineva with instant offline persistence.';
</script>

<svelte:head>
	<title>My Watchlist ({totalCount}) — Cineva</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={canonicalUrl} />
	<meta name="robots" content="noindex, nofollow" />

	<!-- Open Graph / Social Sharing -->
	<meta property="og:site_name" content="Cineva" />
	<meta property="og:title" content="My Watchlist — Cineva" />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonicalUrl} />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Page Header -->
	<div
		class="flex flex-col gap-6 border-b border-cinema-border pb-6 sm:flex-row sm:items-end sm:justify-between"
	>
		<div>
			<div class="flex items-center gap-2 text-xs font-semibold tracking-wider text-cinema-accent">
				<Bookmark class="h-4 w-4 fill-cinema-accent" />
				<span>PERSONAL QUEUE</span>
			</div>
			<h1
				class="mt-2 font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-cinema-text sm:text-4xl"
			>
				My Watchlist
			</h1>
			<p class="mt-2 max-w-xl text-sm text-cinema-text-muted">
				Your curated personal collection of movies and TV series to watch. Stored privately and locally in your
				browser.
			</p>
		</div>

		{#if isInitialized && totalCount > 0}
			<!-- Actions: Clear All Confirmation -->
			<div class="flex flex-wrap items-center gap-3">
				{#if !isConfirmingClear}
					<button
						type="button"
						onclick={() => (isConfirmingClear = true)}
						class="inline-flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-3.5 py-2 text-xs font-medium text-cinema-text-muted shadow-xs transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
					>
						<Trash2 class="h-3.5 w-3.5" />
						<span>Clear All</span>
					</button>
				{:else}
					<div
						class="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-1.5 text-xs text-red-300"
					>
						<span class="px-2 font-medium">Remove all {totalCount} titles?</span>
						<button
							type="button"
							onclick={handleClearAll}
							class="flex h-7 items-center gap-1 rounded-lg bg-red-500 px-2.5 font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
						>
							<Check class="h-3.5 w-3.5" />
							<span>Yes</span>
						</button>
						<button
							type="button"
							onclick={() => (isConfirmingClear = false)}
							class="flex h-7 items-center rounded-lg border border-cinema-border bg-cinema-surface px-2.5 font-medium text-cinema-text-muted hover:text-cinema-text focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
						>
							<X class="h-3.5 w-3.5" />
							<span>Cancel</span>
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Storage Warning if localStorage is disabled / unavailable -->
	{#if !storageAvailable}
		<div
			class="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200"
			role="alert"
		>
			<AlertTriangle class="h-5 w-5 flex-shrink-0 text-amber-400" />
			<div class="text-xs sm:text-sm">
				<p class="font-semibold">Local Storage is Unavailable</p>
				<p class="mt-0.5 text-amber-300/80">
					Your browser storage is disabled or quota exceeded. Changes made during this session may
					not persist after reloading.
				</p>
			</div>
		</div>
	{/if}

	<!-- Content Area -->
	<div class="mt-8">
		{#if !isInitialized}
			<!-- Hydration Skeleton State (prevents layout flash) -->
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
				{#each [1, 2, 3, 4, 5] as skeletonId (skeletonId)}
					<MovieCardSkeleton />
				{/each}
			</div>
		{:else if totalCount === 0}
			<!-- Clean Empty State -->
			<EmptyState
				icon={Bookmark}
				title="Your Watchlist is Empty"
				description="You haven't saved any movies or TV series yet. Explore our curated collections and click 'Add to Watchlist' on any title to queue it for later."
				actionHref="/explore"
				actionLabel="Discover Content"
			/>
		{:else}
			<!-- Controls Bar: Content-Type Filter & Sort -->
			<div class="mb-6 flex flex-col gap-4 border-b border-cinema-border/50 pb-5">
				<!-- Content Type Filter Tabs -->
				<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div
						class="inline-flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface p-1 shadow-xs"
						role="tablist"
						aria-label="Filter watchlist by content type"
					>
						<button
							type="button"
							role="tab"
							aria-selected={contentTypeFilter === 'all'}
							onclick={() => handleContentTypeChange('all')}
							class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {contentTypeFilter ===
							'all'
								? 'bg-cinema-accent text-cinema-accent-foreground shadow-xs'
								: 'text-cinema-text-muted hover:text-cinema-text'}"
						>
							<Layers class="h-3.5 w-3.5" />
							<span>All ({totalCount})</span>
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={contentTypeFilter === 'movie'}
							onclick={() => handleContentTypeChange('movie')}
							class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {contentTypeFilter ===
							'movie'
								? 'bg-cinema-accent text-cinema-accent-foreground shadow-xs'
								: 'text-cinema-text-muted hover:text-cinema-text'}"
						>
							<Film class="h-3.5 w-3.5" />
							<span>Movies ({movieCount})</span>
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={contentTypeFilter === 'tv'}
							onclick={() => handleContentTypeChange('tv')}
							class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {contentTypeFilter ===
							'tv'
								? 'bg-cinema-accent text-cinema-accent-foreground shadow-xs'
								: 'text-cinema-text-muted hover:text-cinema-text'}"
						>
							<Tv class="h-3.5 w-3.5" />
							<span>TV Shows ({tvCount})</span>
						</button>
					</div>

					<!-- Sort & Genre Selects -->
					<div class="flex flex-wrap items-center gap-3">
						<!-- Genre Filter if multiple genres exist -->
						{#if availableGenres.length > 1}
							<div class="relative flex items-center">
								<SlidersHorizontal
									class="pointer-events-none absolute left-3 h-3.5 w-3.5 text-cinema-text-muted"
								/>
								<select
									value={selectedGenre}
									onchange={handleGenreChange}
									aria-label="Filter watchlist by genre"
									class="appearance-none rounded-xl border border-cinema-border bg-cinema-surface py-1.5 pr-8 pl-8 text-xs font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent focus:outline-none"
								>
									<option value="all">All Genres ({contentTypeItems.length})</option>
									{#each availableGenres as genre (genre)}
										<option value={genre}>{genre}</option>
									{/each}
								</select>
							</div>
						{/if}

						<!-- Sort Selector -->
						<div class="relative flex items-center">
							<ArrowUpDown
								class="pointer-events-none absolute left-3 h-3.5 w-3.5 text-cinema-text-muted"
							/>
							<select
								value={sortBy}
								onchange={handleSortChange}
								aria-label="Sort watchlist"
								class="appearance-none rounded-xl border border-cinema-border bg-cinema-surface py-1.5 pr-8 pl-8 text-xs font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent focus:outline-none"
							>
								<option value="date_added_desc">Recently Added</option>
								<option value="date_added_asc">Oldest Added</option>
								<option value="rating_desc">Highest Rated</option>
								<option value="year_desc">Release Year</option>
								<option value="title_asc">Title (A-Z)</option>
							</select>
						</div>
					</div>
				</div>

				<!-- Total Counter & Filter Info -->
				<div class="flex items-center gap-2 text-xs text-cinema-text-muted">
					<span class="font-semibold text-cinema-text">{displayedItems.length}</span>
					<span>
						of {contentTypeItems.length}
						{contentTypeFilter === 'all'
							? 'title'
							: contentTypeFilter === 'movie'
								? 'movie'
								: 'TV show'}{contentTypeItems.length === 1 ? '' : 's'} displayed
						{#if selectedGenre !== 'all'}
							in <span class="font-medium text-cinema-accent">{selectedGenre}</span>
						{/if}
					</span>
				</div>
			</div>

			<!-- Media Grid -->
			{#if displayedItems.length === 0}
				<div class="rounded-2xl border border-cinema-border bg-cinema-surface/40 p-12 text-center">
					{#if contentTypeFilter === 'tv'}
						<Tv class="mx-auto h-10 w-10 text-cinema-text-muted" />
					{:else}
						<Film class="mx-auto h-10 w-10 text-cinema-text-muted" />
					{/if}
					<p class="mt-3 text-sm font-semibold text-cinema-text">
						{#if selectedGenre !== 'all'}
							No {contentTypeFilter === 'tv' ? 'TV shows' : contentTypeFilter === 'movie' ? 'movies' : 'titles'} match genre "{selectedGenre}"
						{:else}
							No {contentTypeFilter === 'tv' ? 'TV shows' : 'movies'} in your watchlist
						{/if}
					</p>
					<button
						type="button"
						onclick={() => {
							selectedGenre = 'all';
							contentTypeFilter = 'all';
						}}
						class="mt-3 text-xs font-semibold text-cinema-accent hover:underline focus-visible:outline-none"
					>
						Show all saved titles
					</button>
				</div>
			{:else}
				<div
					class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5"
				>
					{#each displayedItems as item (`${item.mediaType}:${item.id}`)}
						{#if item.mediaType === 'tv'}
							<TVCard show={watchlistItemToTVShow(item)} />
						{:else}
							<MovieCard movie={watchlistItemToMovie(item)} />
						{/if}
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>
