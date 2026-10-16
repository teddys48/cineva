<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import MovieCard from '#lib/components/movie/MovieCard.svelte';
	import Pagination from '#lib/components/ui/Pagination.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import SectionError from '#lib/components/ui/SectionError.svelte';
	import { ArrowLeft, Building2, MapPin, Globe, ExternalLink, Film } from 'lucide-svelte';

	let { data }: PageProps = $props();
	let company = $derived(data.company);
	let movies = $derived(data.movies);
	let moviesError = $derived(data.moviesError);
	let currentPage = $derived(data.currentPage);
	let totalPages = $derived(data.totalPages);
	let totalResults = $derived(data.totalResults);

	let logoImageError = $state(false);

	let canonicalUrl = $derived(page.url.href);
	let metaDescription = $derived(
		company.description
			? company.description.slice(0, 160).trim()
			: `Discover movies produced by ${company.name} on Cineva.`
	);

	function getPageUrl(p: number): string {
		const u = new URL(page.url.href);
		u.searchParams.set('page', String(p));
		return u.pathname + u.search;
	}
</script>

<svelte:head>
	<title>{company.name} — Production Company — Cineva</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph / Social Sharing -->
	<meta property="og:site_name" content="Cineva" />
	<meta property="og:title" content="{company.name} — Production Company — Cineva" />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonicalUrl} />
	{#if company.logoUrl}
		<meta property="og:image" content={company.logoUrl} />
	{/if}

	<!-- Twitter Cards -->
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="{company.name} — Production Company — Cineva" />
	<meta name="twitter:description" content={metaDescription} />
	{#if company.logoUrl}
		<meta name="twitter:image" content={company.logoUrl} />
	{/if}
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

	<!-- Cinematic Company Header Section -->
	<section
		class="relative mt-4 w-full border-b border-cinema-border bg-cinema-surface/40 py-8 sm:py-12"
		aria-label="Company Overview"
	>
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex flex-col items-center gap-6 md:flex-row md:items-start lg:gap-10">
				<!-- Company Logo or Icon Box -->
				<div
					class="flex h-32 w-32 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface p-4 shadow-lg sm:h-40 sm:w-40"
				>
					{#if company.logoUrl && !logoImageError}
						<img
							src={company.logoUrl}
							alt="{company.name} Logo"
							fetchpriority="high"
							loading="eager"
							onerror={() => (logoImageError = true)}
							class="max-h-full max-w-full object-contain filter dark:brightness-100"
						/>
					{:else}
						<div class="flex flex-col items-center justify-center text-cinema-accent">
							<Building2 class="h-12 w-12" />
						</div>
					{/if}
				</div>

				<!-- Company Details -->
				<div class="flex-1 text-center md:text-left">
					<!-- Pill Badges -->
					<div class="flex flex-wrap items-center justify-center gap-2 md:justify-start">
						<div
							class="inline-flex items-center gap-1.5 rounded-full border border-cinema-border bg-cinema-surface px-3 py-1 text-xs font-semibold text-cinema-accent shadow-xs"
						>
							<Building2 class="h-3 w-3" />
							<span>Production Company</span>
						</div>

						{#if totalResults > 0}
							<div
								class="inline-flex items-center gap-1.5 rounded-full border border-cinema-border/70 bg-cinema-elevated/70 px-3 py-1 text-xs font-medium text-cinema-text-muted shadow-xs"
							>
								<Film class="h-3 w-3" />
								<span>{totalResults} Cataloged Title{totalResults === 1 ? '' : 's'}</span>
							</div>
						{/if}
					</div>

					<!-- Company Name -->
					<h1
						class="mt-3 font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-cinema-text sm:text-4xl"
					>
						{company.name}
					</h1>

					<!-- Metadata: Headquarters & Origin Country -->
					<div
						class="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-cinema-text-muted sm:text-sm md:justify-start"
					>
						{#if company.headquarters}
							<div class="flex items-center gap-1.5">
								<MapPin class="h-3.5 w-3.5 text-cinema-accent" />
								<span>{company.headquarters}</span>
							</div>
						{/if}

						{#if company.originCountry}
							<div class="flex items-center gap-1.5">
								{#if company.headquarters}
									<span>&bull;</span>
								{/if}
								<Globe class="h-3.5 w-3.5 text-cinema-accent" />
								<span>Origin: {company.originCountry}</span>
							</div>
						{/if}
					</div>

					<!-- Description if provided -->
					{#if company.description}
						<p class="mt-4 max-w-2xl text-sm leading-relaxed text-cinema-text/90">
							{company.description}
						</p>
					{/if}

					<!-- Homepage Link if provided -->
					{#if company.homepage}
						<div class="mt-4 flex justify-center md:justify-start">
							<a
								href={company.homepage}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface px-3.5 py-1.5 text-xs font-semibold text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/50 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
							>
								<span>Official Website</span>
								<ExternalLink class="h-3.5 w-3.5 text-cinema-text-muted" />
							</a>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- Main Content: Associated Titles -->
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="mb-8">
			<h2 class="font-['Space_Grotesk'] text-2xl font-bold text-cinema-text sm:text-3xl">
				Associated Titles
			</h2>
			<p class="mt-1 text-xs text-cinema-text-muted">
				Cinematic productions produced or distributed by {company.name}
			</p>
		</div>

		<!-- Error Banner -->
		{#if moviesError}
			<div class="mb-8">
				<SectionError title="Catalog Notice" message={moviesError} />
			</div>
		{/if}

		<!-- Movies Grid -->
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
		{:else if !moviesError}
			<EmptyState
				title="No Associated Movies Found"
				description="There are currently no cataloged movies found for {company.name}."
			/>
		{/if}
	</div>
</div>
