<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { PageData } from './$types';
	import MovieGrid from '#lib/components/movie/MovieGrid.svelte';
	import MovieCardSkeleton from '#lib/components/movie/MovieCardSkeleton.svelte';
	import Pagination from '#lib/components/ui/Pagination.svelte';
	import SectionError from '#lib/components/ui/SectionError.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import {
		Compass,
		SlidersHorizontal,
		X,
		RotateCcw,
		Calendar,
		Star,
		ArrowUpDown,
		ChevronDown
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let isMobileFiltersOpen = $state(false);

	const sortOptions = [
		{ value: 'popularity.desc', label: 'Most Popular' },
		{ value: 'vote_average.desc', label: 'Highest Rated' },
		{ value: 'primary_release_date.desc', label: 'Newest Releases' },
		{ value: 'primary_release_date.asc', label: 'Oldest Releases' }
	];

	const ratingOptions = [
		{ value: '', label: 'Any Rating' },
		{ value: '8', label: '8.0+ Exceptional' },
		{ value: '7', label: '7.0+ Recommended' },
		{ value: '6', label: '6.0+ Good' },
		{ value: '5', label: '5.0+ Average' }
	];

	// Generate curated release years
	const currentYear = new Date().getFullYear();
	const yearOptions = [
		{ value: '', label: 'All Years' },
		...Array.from({ length: 15 }, (_, i) => ({
			value: String(currentYear - i),
			label: String(currentYear - i)
		})),
		{ value: '2010', label: '2010' },
		{ value: '2005', label: '2005' },
		{ value: '2000', label: '2000' },
		{ value: '1995', label: '1995' },
		{ value: '1990', label: '1990' },
		{ value: '1980', label: '1980' },
		{ value: '1970', label: '1970' }
	];

	const activeFilterCount = $derived(
		(data.filters.genre ? 1 : 0) +
			(data.filters.year ? 1 : 0) +
			(data.filters.minRating ? 1 : 0) +
			(data.filters.sortBy && data.filters.sortBy !== 'popularity.desc' ? 1 : 0)
	);

	const currentGenreName = $derived.by(() => {
		if (!data.filters.genre) return '';
		if (data.filters.genreName) return data.filters.genreName;
		const found = data.genres.find((g) => String(g.id) === String(data.filters.genre));
		return found ? found.name : `Genre ${data.filters.genre}`;
	});

	const currentSortLabel = $derived.by(() => {
		const found = sortOptions.find((s) => s.value === data.filters.sortBy);
		return found ? found.label : 'Most Popular';
	});

	function buildFilterUrl(newFilters: {
		genre?: string | number | null;
		year?: number | null;
		minRating?: number | null;
		sortBy?: string | null;
		page?: number | null;
	}): string {
		const params = new SvelteURLSearchParams();

		const genre = newFilters.genre !== undefined ? newFilters.genre : data.filters.genre;
		if (genre) params.set('genre', String(genre));

		const year = newFilters.year !== undefined ? newFilters.year : data.filters.year;
		if (year) params.set('year', String(year));

		const minRating =
			newFilters.minRating !== undefined ? newFilters.minRating : data.filters.minRating;
		if (minRating) params.set('minRating', String(minRating));

		const sortBy = newFilters.sortBy !== undefined ? newFilters.sortBy : data.filters.sortBy;
		if (sortBy && sortBy !== 'popularity.desc') params.set('sortBy', sortBy);

		const p = newFilters.page !== undefined ? newFilters.page : data.filters.page;
		if (p && p > 1) params.set('page', String(p));

		const queryString = params.toString();
		return queryString ? `/explore?${queryString}` : '/explore';
	}

	function handleFilterChange(updates: {
		genre?: string | number | null;
		year?: number | null;
		minRating?: number | null;
		sortBy?: string | null;
	}) {
		// Reset to page 1 whenever any filter criterion changes
		const nextUrl = buildFilterUrl({ ...updates, page: 1 });
		goto(nextUrl);
	}

	function handlePageSelect(targetPage: number) {
		const nextUrl = buildFilterUrl({ page: targetPage });
		goto(nextUrl);
		window.scrollTo({ top: 120, behavior: 'smooth' });
	}

	function resetAllFilters() {
		goto('/explore');
	}
</script>

<svelte:head>
	<title
		>{currentGenreName
			? `${currentGenreName} Movies - Explore Cineva`
			: 'Explore Cinema — Cineva'}</title
	>
	<meta
		name="description"
		content="Explore curated cinema across genres, release eras, and ratings powered by TMDB in Cineva."
	/>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Page Header -->
	<div class="border-b border-cinema-border pb-6">
		<div class="flex items-center gap-2 text-xs font-semibold tracking-wider text-cinema-accent">
			<Compass class="h-4 w-4" />
			<span>EXPLORE CINEMA</span>
		</div>
		<h1
			class="mt-2 font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-cinema-text sm:text-4xl"
		>
			Explore Catalog
		</h1>
		<p class="mt-2 max-w-2xl text-sm leading-relaxed text-cinema-text-muted">
			Discover films across TMDB's comprehensive database. Filter by genre, release era, and rating,
			or sort by popularity and acclaim.
		</p>

		<!-- Genre Filter Pills -->
		<div class="mt-6">
			<div class="flex items-center justify-between pb-2">
				<span class="text-xs font-medium text-cinema-text-muted">Browse by Genre:</span>
				{#if data.filters.genre}
					<button
						type="button"
						onclick={() => handleFilterChange({ genre: null })}
						class="text-xs text-cinema-accent hover:underline focus-visible:outline-none"
					>
						Clear Genre
					</button>
				{/if}
			</div>

			<div class="custom-scrollbar flex items-center gap-2 overflow-x-auto pt-1 pb-2">
				<button
					type="button"
					onclick={() => handleFilterChange({ genre: null })}
					class="shrink-0 rounded-full px-4 py-1.5 text-xs font-medium shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none {!data
						.filters.genre
						? 'bg-cinema-accent font-semibold text-cinema-accent-foreground'
						: 'border border-cinema-border bg-cinema-surface text-cinema-text-muted hover:border-cinema-accent/40 hover:bg-cinema-elevated hover:text-cinema-text'}"
				>
					All Genres
				</button>

				{#each data.genres as genre (genre.id)}
					{@const isSelected = String(genre.id) === String(data.filters.genre)}
					<button
						type="button"
						onclick={() => handleFilterChange({ genre: isSelected ? null : genre.id })}
						class="shrink-0 rounded-full px-4 py-1.5 text-xs font-medium shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none {isSelected
							? 'bg-cinema-accent font-semibold text-cinema-accent-foreground'
							: 'border border-cinema-border bg-cinema-surface text-cinema-text-muted hover:border-cinema-accent/40 hover:bg-cinema-elevated hover:text-cinema-text'}"
					>
						{genre.name}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Secondary Filter Controls & Responsive Layout -->
	<div class="border-b border-cinema-border py-4">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<!-- Mobile Toggle for Secondary Filters -->
			<div class="flex items-center justify-between md:hidden">
				<button
					type="button"
					onclick={() => (isMobileFiltersOpen = !isMobileFiltersOpen)}
					class="inline-flex items-center gap-2 rounded-lg border border-cinema-border bg-cinema-surface px-3.5 py-2 text-xs font-medium text-cinema-text shadow-xs transition-colors hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
					aria-expanded={isMobileFiltersOpen}
				>
					<SlidersHorizontal class="h-3.5 w-3.5 text-cinema-accent" />
					<span>Filters</span>
					{#if activeFilterCount > 0}
						<span
							class="flex h-5 w-5 items-center justify-center rounded-full bg-cinema-accent text-[10px] font-bold text-cinema-accent-foreground"
						>
							{activeFilterCount}
						</span>
					{/if}
					<ChevronDown
						class="h-3.5 w-3.5 transition-transform duration-200 {isMobileFiltersOpen
							? 'rotate-180'
							: ''}"
					/>
				</button>

				{#if activeFilterCount > 0}
					<button
						type="button"
						onclick={resetAllFilters}
						class="flex items-center gap-1.5 text-xs text-cinema-text-muted hover:text-cinema-accent"
					>
						<RotateCcw class="h-3 w-3" />
						<span>Reset</span>
					</button>
				{/if}
			</div>

			<!-- Desktop & Collapsible Filter Group -->
			<div
				class="{isMobileFiltersOpen
					? 'flex'
					: 'hidden'} flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 md:flex"
			>
				<!-- Release Year Selector -->
				<div class="flex items-center gap-2">
					<label for="filter-year" class="flex items-center gap-1.5 text-xs text-cinema-text-muted">
						<Calendar class="h-3.5 w-3.5 text-cinema-accent" />
						<span>Year:</span>
					</label>
					<select
						id="filter-year"
						value={data.filters.year ? String(data.filters.year) : ''}
						onchange={(e) => {
							const val = (e.target as HTMLSelectElement).value;
							handleFilterChange({ year: val ? parseInt(val, 10) : null });
						}}
						class="rounded-lg border border-cinema-border bg-cinema-surface px-2.5 py-1.5 text-xs text-cinema-text shadow-xs transition-colors focus:border-cinema-accent focus:bg-cinema-elevated focus:ring-1 focus:ring-cinema-accent focus:outline-none"
					>
						{#each yearOptions as opt (opt.value)}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>

				<!-- Minimum Rating Selector -->
				<div class="flex items-center gap-2">
					<label
						for="filter-rating"
						class="flex items-center gap-1.5 text-xs text-cinema-text-muted"
					>
						<Star class="h-3.5 w-3.5 text-cinema-accent" />
						<span>Rating:</span>
					</label>
					<select
						id="filter-rating"
						value={data.filters.minRating ? String(data.filters.minRating) : ''}
						onchange={(e) => {
							const val = (e.target as HTMLSelectElement).value;
							handleFilterChange({ minRating: val ? parseFloat(val) : null });
						}}
						class="rounded-lg border border-cinema-border bg-cinema-surface px-2.5 py-1.5 text-xs text-cinema-text shadow-xs transition-colors focus:border-cinema-accent focus:bg-cinema-elevated focus:ring-1 focus:ring-cinema-accent focus:outline-none"
					>
						{#each ratingOptions as opt (opt.value)}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>

				<!-- Sort Order Selector -->
				<div class="flex items-center gap-2">
					<label for="filter-sort" class="flex items-center gap-1.5 text-xs text-cinema-text-muted">
						<ArrowUpDown class="h-3.5 w-3.5 text-cinema-accent" />
						<span>Sort:</span>
					</label>
					<select
						id="filter-sort"
						value={data.filters.sortBy || 'popularity.desc'}
						onchange={(e) => {
							const val = (e.target as HTMLSelectElement).value;
							handleFilterChange({ sortBy: val });
						}}
						class="rounded-lg border border-cinema-border bg-cinema-surface px-2.5 py-1.5 text-xs text-cinema-text shadow-xs transition-colors focus:border-cinema-accent focus:bg-cinema-elevated focus:ring-1 focus:ring-cinema-accent focus:outline-none"
					>
						{#each sortOptions as opt (opt.value)}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Result Stats Counter -->
			<div class="hidden items-center gap-3 text-xs text-cinema-text-muted sm:flex">
				{#if data.totalResults > 0}
					<span>
						Showing page <span class="font-mono text-cinema-text">{data.filters.page}</span> of
						<span class="font-mono text-cinema-text">{Math.min(500, data.totalPages)}</span>
						({data.totalResults.toLocaleString()} titles)
					</span>
				{/if}
				{#if activeFilterCount > 0}
					<button
						type="button"
						onclick={resetAllFilters}
						class="flex items-center gap-1 rounded-md border border-cinema-border px-2 py-1 text-cinema-text transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated"
						aria-label="Reset all filters"
					>
						<RotateCcw class="h-3 w-3" />
						<span>Reset</span>
					</button>
				{/if}
			</div>
		</div>

		<!-- Active Filters Chips Bar -->
		{#if activeFilterCount > 0}
			<div class="mt-4 flex flex-wrap items-center gap-2 pt-2">
				<span class="text-xs text-cinema-text-muted">Active:</span>

				{#if data.filters.genre}
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-cinema-border bg-cinema-surface px-2.5 py-1 text-xs text-cinema-text shadow-xs"
					>
						<span>Genre: {currentGenreName}</span>
						<button
							type="button"
							onclick={() => handleFilterChange({ genre: null })}
							class="text-cinema-text-muted hover:text-cinema-text focus-visible:outline-none"
							aria-label="Remove genre filter"
						>
							<X class="h-3 w-3" />
						</button>
					</span>
				{/if}

				{#if data.filters.year}
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-cinema-border bg-cinema-surface px-2.5 py-1 text-xs text-cinema-text shadow-xs"
					>
						<span>Year: {data.filters.year}</span>
						<button
							type="button"
							onclick={() => handleFilterChange({ year: null })}
							class="text-cinema-text-muted hover:text-cinema-text focus-visible:outline-none"
							aria-label="Remove year filter"
						>
							<X class="h-3 w-3" />
						</button>
					</span>
				{/if}

				{#if data.filters.minRating}
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-cinema-border bg-cinema-surface px-2.5 py-1 text-xs text-cinema-text shadow-xs"
					>
						<span>Rating: {data.filters.minRating.toFixed(1)}+</span>
						<button
							type="button"
							onclick={() => handleFilterChange({ minRating: null })}
							class="text-cinema-text-muted hover:text-cinema-text focus-visible:outline-none"
							aria-label="Remove rating filter"
						>
							<X class="h-3 w-3" />
						</button>
					</span>
				{/if}

				{#if data.filters.sortBy && data.filters.sortBy !== 'popularity.desc'}
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-cinema-border bg-cinema-surface px-2.5 py-1 text-xs text-cinema-text shadow-xs"
					>
						<span>Sort: {currentSortLabel}</span>
						<button
							type="button"
							onclick={() => handleFilterChange({ sortBy: 'popularity.desc' })}
							class="text-cinema-text-muted hover:text-cinema-text focus-visible:outline-none"
							aria-label="Reset sort order"
						>
							<X class="h-3 w-3" />
						</button>
					</span>
				{/if}

				<button
					type="button"
					onclick={resetAllFilters}
					class="text-xs text-cinema-accent hover:underline focus-visible:outline-none"
				>
					Clear All
				</button>
			</div>
		{/if}
	</div>

	<!-- Results / Content Area -->
	<div class="mt-8">
		{#if data.error}
			<SectionError
				title="Error Loading Explore Movies"
				message={data.error}
				onretry={() => goto(buildFilterUrl({}), { invalidateAll: true })}
			/>
		{:else if navigating.to}
			<!-- Loading state during SvelteKit page navigation -->
			<div
				class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5"
				aria-busy="true"
				aria-live="polite"
			>
				{#each Array.from({ length: 15 }, (_, idx) => idx) as idx (idx)}
					<MovieCardSkeleton />
				{/each}
			</div>
		{:else if data.movies.length > 0}
			<MovieGrid movies={data.movies} />

			<!-- Pagination Controls -->
			<Pagination
				currentPage={data.filters.page}
				totalPages={data.totalPages}
				getPageUrl={(p) => buildFilterUrl({ page: p })}
				onPageSelect={handlePageSelect}
			/>
		{:else}
			<EmptyState
				title="No Matching Movies Found"
				description="We couldn't find any films matching the selected criteria ({[
					currentGenreName,
					data.filters.year,
					data.filters.minRating ? `${data.filters.minRating}+ rating` : null
				]
					.filter(Boolean)
					.join(', ')}). Try adjusting or clearing your filters."
				actionLabel="Reset All Filters"
				actionHref="/explore"
			/>
		{/if}
	</div>
</div>
