<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import MovieCard from '#lib/components/movie/MovieCard.svelte';
	import Pagination from '#lib/components/ui/Pagination.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import SectionError from '#lib/components/ui/SectionError.svelte';
	import { ArrowLeft, Globe, Film, ArrowUpDown } from 'lucide-svelte';

	let { data }: PageProps = $props();
	let countryCode = $derived(data.countryCode);
	let countryName = $derived(data.countryName);
	let movies = $derived(data.movies);
	let totalPages = $derived(data.totalPages);
	let totalResults = $derived(data.totalResults);
	let currentPage = $derived(data.currentPage);
	let sortBy = $derived(data.sortBy);
	let fetchError = $derived(data.error);

	let canonicalUrl = $derived(page.url.href);
	let metaDescription = $derived(
		`Discover acclaimed and trending films originating and produced in ${countryName} (ISO: ${countryCode}) on Cineva.`
	);

	function getPageUrl(p: number): string {
		const u = new URL(page.url.href);
		u.searchParams.set('page', String(p));
		if (sortBy && sortBy !== 'popularity.desc') {
			u.searchParams.set('sortBy', sortBy);
		}
		return u.pathname + u.search;
	}

	function handleSortChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		const newSort = select.value;
		const u = new URL(window.location.href);
		u.searchParams.set('sortBy', newSort);
		u.searchParams.set('page', '1');
		window.location.href = u.pathname + u.search;
	}
</script>

<svelte:head>
	<title>Cinema of {countryName} — Film Discovery — Cineva</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph / Social Sharing -->
	<meta property="og:site_name" content="Cineva" />
	<meta property="og:title" content="Cinema of {countryName} — Cineva" />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonicalUrl} />

	<!-- Twitter Cards -->
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="Cinema of {countryName} — Cineva" />
	<meta name="twitter:description" content={metaDescription} />
</svelte:head>

<div class="relative w-full overflow-hidden">
	<!-- Top Navigation Backlink -->
	<div class="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
		<a
			href="/explore"
			class="inline-flex items-center gap-1.5 rounded-lg py-1 text-xs font-semibold text-cinema-text-muted transition-colors hover:text-cinema-accent focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
		>
			<ArrowLeft class="h-3.5 w-3.5" />
			<span>Back to Discovery</span>
		</a>
	</div>

	<!-- Cinematic Country Header Section -->
	<section
		class="relative mt-4 w-full border-b border-cinema-border bg-cinema-surface/40 py-8 sm:py-12"
		aria-label="Country Production Overview"
	>
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
				<div>
					<!-- Badges -->
					<div class="flex flex-wrap items-center gap-2">
						<div
							class="inline-flex items-center gap-1.5 rounded-full border border-cinema-border bg-cinema-surface px-3 py-1 text-xs font-semibold text-cinema-accent shadow-xs"
						>
							<Globe class="h-3 w-3" />
							<span>Production Country</span>
						</div>

						<span
							class="rounded-full border border-cinema-border/70 bg-cinema-elevated/70 px-2.5 py-1 font-mono text-xs font-bold text-cinema-text"
						>
							{countryCode}
						</span>

						{#if totalResults > 0}
							<div
								class="inline-flex items-center gap-1.5 rounded-full border border-cinema-border/70 bg-cinema-elevated/70 px-3 py-1 text-xs font-medium text-cinema-text-muted shadow-xs"
							>
								<Film class="h-3 w-3" />
								<span
									>{totalResults.toLocaleString('en-US')} Title{totalResults === 1 ? '' : 's'}</span
								>
							</div>
						{/if}
					</div>

					<h1
						class="mt-3 font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-cinema-text sm:text-4xl lg:text-5xl"
					>
						Cinema of {countryName}
					</h1>
					<p class="mt-2 text-sm text-cinema-text-muted sm:text-base">
						Explore cinematic productions originating from and produced in {countryName}.
					</p>
				</div>

				<!-- Sort Controls -->
				<div class="flex items-center gap-2 self-start md:self-end">
					<div class="relative">
						<label for="country-sort" class="sr-only">Sort films by</label>
						<div
							class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-cinema-text-muted"
						>
							<ArrowUpDown class="h-3.5 w-3.5 text-cinema-accent" />
						</div>
						<select
							id="country-sort"
							value={sortBy}
							onchange={handleSortChange}
							class="h-10 rounded-xl border border-cinema-border bg-cinema-surface pr-8 pl-9 text-xs font-semibold text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent focus:outline-none"
						>
							<option value="popularity.desc">Most Popular</option>
							<option value="vote_average.desc">Highest Rated</option>
							<option value="primary_release_date.desc">Newest Releases</option>
							<option value="primary_release_date.asc">Earliest Releases</option>
						</select>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Main Content: Movies Grid -->
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<!-- Error Notice -->
		{#if fetchError}
			<div class="mb-8">
				<SectionError title="Discovery Notice" message={fetchError} />
			</div>
		{/if}

		<!-- Movie Grid -->
		{#if movies.length > 0}
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-4">
				{#each movies as movie (movie.id)}
					<MovieCard {movie} />
				{/each}
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="mt-12">
					<Pagination {currentPage} {totalPages} {getPageUrl} />
				</div>
			{/if}
		{:else if !fetchError}
			<EmptyState
				title="No Productions Found"
				description="There are currently no cataloged movies originating from {countryName}."
			/>
		{/if}
	</div>
</div>
