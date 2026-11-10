<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import TVCard from '#lib/components/tv/TVCard.svelte';
	import MovieArtworkGallery from '#lib/components/movie/MovieArtworkGallery.svelte';
	import TrailerModal from '#lib/components/movie/TrailerModal.svelte';
	import WatchlistButton from '#lib/components/movie/WatchlistButton.svelte';
	import SectionError from '#lib/components/ui/SectionError.svelte';
	import { personalizationState } from '#lib/personalization.svelte';
	import {
		Star,
		Play,
		Share2,
		ArrowLeft,
		Tv,
		Info,
		Sparkles,
		Images,
		Layers,
		Building2,
		Globe,
		Calendar,
		Clock,
		ExternalLink
	} from 'lucide-svelte';

	let { data }: PageProps = $props();
	let tvShow = $derived(data.tvShow);
	let similar = $derived(data.similar);
	let recommendations = $derived(data.recommendations);
	let gallery = $derived(
		data.gallery ||
			tvShow.gallery || {
				posters: [],
				backdrops: [],
				logos: [],
				all: [],
				totalCount: 0,
				error: null
			}
	);

	// State
	let trailerModalOpen = $state(false);
	let copiedLink = $state(false);
	let backdropError = $state(false);
	let posterError = $state(false);

	// Record recently viewed show in personalization store
	$effect(() => {
		const currentShow = tvShow;
		if (currentShow && typeof window !== 'undefined') {
			untrack(() => {
				personalizationState.addRecentlyViewed(currentShow);
			});
		}
	});
	function openTrailer() {
		if (tvShow.trailer) {
			trailerModalOpen = true;
		}
	}

	function closeTrailer() {
		trailerModalOpen = false;
	}

	function shareShow() {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(window.location.href);
			copiedLink = true;
			setTimeout(() => {
				copiedLink = false;
			}, 2000);
		}
	}

	function scrollToSeasons() {
		if (typeof document !== 'undefined') {
			const target = document.getElementById('seasons');
			target?.scrollIntoView({ behavior: 'smooth' });
		}
	}

	function scrollToDetails() {
		if (typeof document !== 'undefined') {
			const target = document.getElementById('details');
			target?.scrollIntoView({ behavior: 'smooth' });
		}
	}

	function scrollToGallery() {
		if (typeof document !== 'undefined') {
			const target = document.getElementById('gallery');
			target?.scrollIntoView({ behavior: 'smooth' });
		}
	}

	let canonicalUrl = $derived(page.url.href);
	let ogImage = $derived(tvShow.backdropUrl || tvShow.posterUrl || '');
	let formattedRating = $derived(
		typeof tvShow.rating === 'number' && !Number.isNaN(tvShow.rating) && tvShow.rating > 0
			? tvShow.rating.toFixed(1)
			: null
	);
	let formattedVotes = $derived(
		tvShow.voteCount && tvShow.voteCount > 0
			? new Intl.NumberFormat('en-US').format(tvShow.voteCount)
			: null
	);

	// Years display e.g. "2021 – 2024" or "2022 – Present"
	let yearsSpan = $derived.by(() => {
		if (!tvShow.firstAirYear) return '';
		const start = String(tvShow.firstAirYear);
		if (tvShow.status === 'Returning Series') {
			return `${start} – Present`;
		}
		if (tvShow.lastAirDate) {
			const endYear = new Date(tvShow.lastAirDate).getFullYear();
			if (!isNaN(endYear) && endYear !== tvShow.firstAirYear) {
				return `${start} – ${endYear}`;
			}
		}
		return start;
	});
</script>

<svelte:head>
	<title>{tvShow.name} {tvShow.firstAirYear ? `(${tvShow.firstAirYear})` : ''} — Cineva</title>
	<meta name="description" content={tvShow.overview} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph / Social Sharing -->
	<meta property="og:site_name" content="Cineva" />
	<meta
		property="og:title"
		content="{tvShow.name} {tvShow.firstAirYear ? `(${tvShow.firstAirYear})` : ''} — Cineva"
	/>
	<meta property="og:description" content={tvShow.overview} />
	<meta property="og:type" content="video.tv_show" />
	<meta property="og:url" content={canonicalUrl} />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
	{/if}

	<!-- Twitter Cards -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:title"
		content="{tvShow.name} {tvShow.firstAirYear ? `(${tvShow.firstAirYear})` : ''} — Cineva"
	/>
	<meta name="twitter:description" content={tvShow.overview} />
	{#if ogImage}
		<meta name="twitter:image" content={ogImage} />
	{/if}
</svelte:head>

<div class="relative w-full overflow-hidden">
	<!-- Top Navigation Backlink -->
	<div class="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
		<a
			href="/explore?type=tv"
			class="inline-flex items-center gap-1.5 rounded-lg py-1 text-xs font-semibold text-cinema-text-muted transition-colors hover:text-cinema-accent focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
		>
			<ArrowLeft class="h-3.5 w-3.5" />
			<span>Back to TV Discovery</span>
		</a>
	</div>

	<!-- Cinematic Hero Section -->
	<section
		class="relative mt-4 min-h-[460px] w-full overflow-hidden border-b border-cinema-border bg-cinema-bg sm:min-h-[520px] lg:min-h-[580px]"
		aria-label="TV Series Overview and Hero"
	>
		<!-- Background Art with Multi-Stage High Contrast Scrim -->
		<div class="absolute inset-0 z-0 overflow-hidden bg-cinema-surface">
			{#if tvShow.backdropUrl && !backdropError}
				<img
					src={tvShow.backdropUrl}
					alt="Cinematic backdrop for {tvShow.name}"
					fetchpriority="high"
					loading="eager"
					onerror={() => (backdropError = true)}
					class="h-full w-full object-cover object-center opacity-40 brightness-75 filter transition-opacity duration-700"
				/>
			{:else}
				<div class="h-full w-full bg-gradient-to-br from-cinema-surface to-cinema-bg opacity-80"></div>
			{/if}

			<!-- Multi-stage Scrim Gradients -->
			<div
				class="absolute inset-0 bg-gradient-to-t from-cinema-bg via-cinema-bg/80 to-transparent"
			></div>
			<div
				class="absolute inset-0 bg-gradient-to-r from-cinema-bg via-cinema-bg/70 to-transparent"
			></div>
		</div>

		<!-- Hero Content Container -->
		<div class="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
			<div class="flex flex-col gap-8 md:flex-row md:items-start md:gap-10 lg:gap-14">
				<!-- Poster Card Container -->
				<div class="mx-auto w-48 shrink-0 sm:w-56 md:mx-0 md:w-64 lg:w-72">
					<div
						class="overflow-hidden rounded-2xl border border-cinema-border/80 bg-cinema-surface shadow-2xl transition-transform duration-300 hover:scale-[1.01]"
					>
						<div class="relative aspect-[2/3] w-full bg-cinema-muted">
							{#if tvShow.posterUrl && !posterError}
								<img
									src={tvShow.posterUrl}
									alt="Official series poster for {tvShow.name}"
									fetchpriority="high"
									loading="eager"
									onerror={() => (posterError = true)}
									class="h-full w-full object-cover"
								/>
							{:else}
								<div
									class="flex h-full w-full flex-col items-center justify-center p-4 text-center text-cinema-text-muted"
								>
									<Tv class="h-12 w-12 text-cinema-accent" />
									<span class="mt-2 text-xs font-semibold">Artwork Unavailable</span>
								</div>
							{/if}

							<!-- TV Badge -->
							<div
								class="absolute top-3 left-3 flex items-center gap-1 rounded-md border border-cinema-border/50 bg-cinema-bg/90 px-2 py-0.5 text-[10px] font-bold tracking-wider text-cinema-accent uppercase backdrop-blur-md"
							>
								<Tv class="h-3 w-3" />
								<span>TV Series</span>
							</div>

							<!-- Content Rating Tag -->
							{#if tvShow.contentRating}
								<div
									class="absolute top-3 right-3 rounded-md border border-cinema-border/50 bg-cinema-bg/90 px-2 py-0.5 text-xs font-bold text-cinema-text backdrop-blur-md"
								>
									{tvShow.contentRating}
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Series Details and Action Section -->
				<div class="flex min-w-0 flex-1 flex-col justify-center">
					<!-- Title & Tagline -->
					<h1
						class="font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-cinema-text sm:text-4xl lg:text-5xl"
					>
						{tvShow.name}
					</h1>

					{#if tvShow.originalName && tvShow.originalName !== tvShow.name}
						<p class="mt-1 text-sm text-cinema-text-muted italic">
							Original title: {tvShow.originalName}
						</p>
					{/if}

					{#if tvShow.tagline}
						<p class="mt-2 text-sm font-medium text-cinema-accent italic sm:text-base">
							"{tvShow.tagline}"
						</p>
					{/if}

					<!-- Metadata Strip -->
					<div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-cinema-text-muted sm:text-sm">
						{#if formattedRating}
							<div
								class="flex items-center gap-1 rounded-md border border-cinema-border/60 bg-cinema-surface/70 px-2.5 py-1 font-semibold text-cinema-text"
							>
								<Star class="h-4 w-4 fill-cinema-accent text-cinema-accent" />
								<span>{formattedRating}</span>
								{#if formattedVotes}
									<span class="text-xs text-cinema-text-muted">({formattedVotes})</span>
								{/if}
							</div>
						{/if}

						{#if yearsSpan}
							<div
								class="flex items-center gap-1 rounded-md border border-cinema-border/60 bg-cinema-surface/70 px-2.5 py-1"
							>
								<Calendar class="h-3.5 w-3.5 text-cinema-accent" />
								<span>{yearsSpan}</span>
							</div>
						{/if}

						{#if tvShow.numberOfSeasons}
							<div
								class="flex items-center gap-1 rounded-md border border-cinema-border/60 bg-cinema-surface/70 px-2.5 py-1"
							>
								<Layers class="h-3.5 w-3.5 text-cinema-accent" />
								<span>{tvShow.numberOfSeasons} {tvShow.numberOfSeasons === 1 ? 'Season' : 'Seasons'}</span>
							</div>
						{/if}

						{#if tvShow.numberOfEpisodes}
							<div
								class="flex items-center gap-1 rounded-md border border-cinema-border/60 bg-cinema-surface/70 px-2.5 py-1"
							>
								<span>{tvShow.numberOfEpisodes} Episodes</span>
							</div>
						{/if}

						{#if tvShow.episodeRuntime}
							<div
								class="flex items-center gap-1 rounded-md border border-cinema-border/60 bg-cinema-surface/70 px-2.5 py-1"
							>
								<Clock class="h-3.5 w-3.5 text-cinema-accent" />
								<span>{tvShow.episodeRuntime}/ep</span>
							</div>
						{/if}

						{#if tvShow.status}
							<div
								class="rounded-md border border-cinema-border/60 bg-cinema-surface/70 px-2.5 py-1 text-xs font-semibold text-cinema-text"
							>
								{tvShow.status}
							</div>
						{/if}
					</div>

					<!-- Genre Pills -->
					{#if tvShow.genres && tvShow.genres.length > 0}
						<div class="mt-4 flex flex-wrap items-center gap-1.5">
							{#each tvShow.genres as genre (genre)}
								<a
									href="/explore?type=tv&genre={encodeURIComponent(genre)}"
									class="rounded-full border border-cinema-border bg-cinema-surface/80 px-3 py-1 text-xs font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/60 hover:text-cinema-accent focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
								>
									{genre}
								</a>
							{/each}
						</div>
					{/if}

					<!-- Action Buttons -->
					<div class="mt-6 flex flex-wrap items-center gap-3">
						<WatchlistButton item={tvShow} variant="button" />

						{#if tvShow.trailer}
							<button
								type="button"
								onclick={openTrailer}
								class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cinema-accent px-5 text-sm font-semibold text-cinema-accent-foreground shadow-sm transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none active:scale-[0.98]"
							>
								<Play class="h-4 w-4 fill-current" />
								<span>Watch Trailer</span>
							</button>
						{/if}

						<button
							type="button"
							onclick={shareShow}
							class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-4 text-sm font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none active:scale-[0.98]"
							aria-label="Share TV series link"
						>
							<Share2 class="h-4 w-4 text-cinema-text-muted" />
							<span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
						</button>

						{#if tvShow.seasons && tvShow.seasons.length > 0}
							<button
								type="button"
								onclick={scrollToSeasons}
								class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-4 text-sm font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none active:scale-[0.98]"
							>
								<Layers class="h-4 w-4 text-cinema-accent" />
								<span>Seasons ({tvShow.seasons.length})</span>
							</button>
						{/if}

						{#if gallery.totalCount > 0}
							<button
								type="button"
								onclick={scrollToGallery}
								class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-4 text-sm font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none active:scale-[0.98]"
							>
								<Images class="h-4 w-4 text-cinema-accent" />
								<span>Gallery ({gallery.totalCount})</span>
							</button>
						{/if}
					</div>

					<!-- Creators preview if present -->
					{#if tvShow.creators && tvShow.creators.length > 0}
						<div class="mt-6 flex flex-wrap items-center gap-2 text-xs text-cinema-text-muted">
							<span class="font-semibold text-cinema-text">Created by:</span>
							{#each tvShow.creators as creator, i (creator.id)}
								<a
									href="/person/{creator.id}"
									class="text-cinema-accent hover:underline focus-visible:outline-none"
								>
									{creator.name}
								</a>
								{#if i < tvShow.creators.length - 1}
									<span>•</span>
								{/if}
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- Main Body Layout -->
	<main class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<!-- Section 1: Synopsis & Extended Production Metadata -->
		<section id="details" class="mb-14" aria-label="Series Synopsis and Metadata">
			<div class="grid grid-cols-1 gap-10 lg:grid-cols-3">
				<!-- Left 2 Cols: Synopsis & Production Info -->
				<div class="space-y-8 lg:col-span-2">
					<div>
						<h2 class="font-['Space_Grotesk'] text-xl font-bold text-cinema-text sm:text-2xl">
							Synopsis
						</h2>
						<p class="mt-3 text-base leading-relaxed text-cinema-text/90 sm:text-lg sm:leading-relaxed">
							{tvShow.overview || 'No synopsis is currently available for this series.'}
						</p>
					</div>

					<!-- Networks & Production Details -->
					<div class="rounded-2xl border border-cinema-border/70 bg-cinema-surface/60 p-6 sm:p-7">
						<h3 class="font-['Space_Grotesk'] text-base font-semibold text-cinema-text">
							Broadcast & Production Details
						</h3>

						<div class="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
							<!-- Networks -->
							{#if tvShow.networks && tvShow.networks.length > 0}
								<div>
									<div
										class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-text-muted uppercase"
									>
										<Tv class="h-3.5 w-3.5 text-cinema-accent" />
										<span>Original Networks</span>
									</div>
									<div class="mt-2.5 flex flex-wrap items-center gap-2">
										{#each tvShow.networks as network (network.id)}
											<div
												class="inline-flex items-center gap-2 rounded-lg border border-cinema-border bg-cinema-surface px-3 py-1.5 text-xs font-semibold text-cinema-text shadow-xs"
											>
												{#if network.logoUrl}
													<img
														src={network.logoUrl}
														alt="{network.name} logo"
														class="h-4 max-w-[80px] object-contain dark:brightness-200"
													/>
												{/if}
												<span>{network.name}</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Production Companies -->
							{#if tvShow.productionCompanies && tvShow.productionCompanies.length > 0}
								<div>
									<div
										class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-text-muted uppercase"
									>
										<Building2 class="h-3.5 w-3.5 text-cinema-accent" />
										<span>Production Companies</span>
									</div>
									<div class="mt-2.5 flex flex-wrap items-center gap-2">
										{#if tvShow.productionCompaniesList && tvShow.productionCompaniesList.length > 0}
											{#each tvShow.productionCompaniesList as company (company.id)}
												<a
													href="/company/{company.id}"
													class="inline-flex items-center gap-1.5 rounded-lg border border-cinema-border bg-cinema-surface px-2.5 py-1 text-xs font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/50 hover:text-cinema-accent focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
												>
													<span>{company.name}</span>
												</a>
											{/each}
										{:else}
											<p class="text-sm text-cinema-text">
												{tvShow.productionCompanies.join(' • ')}
											</p>
										{/if}
									</div>
								</div>
							{/if}

							<!-- Country of Origin -->
							{#if tvShow.originCountry && tvShow.originCountry.length > 0}
								<div>
									<div
										class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-text-muted uppercase"
									>
										<Globe class="h-3.5 w-3.5 text-cinema-accent" />
										<span>Countries of Origin</span>
									</div>
									<p class="mt-1 text-sm text-cinema-text">
										{tvShow.originCountry.join(', ')}
									</p>
								</div>
							{/if}

							<!-- Original Language -->
							{#if tvShow.originalLanguageName}
								<div>
									<div
										class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-text-muted uppercase"
									>
										<span>Original Language</span>
									</div>
									<p class="mt-1 text-sm text-cinema-text">
										{tvShow.originalLanguageName}
									</p>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Right Col: Quick Facts Sidebar -->
				<div>
					<div class="rounded-2xl border border-cinema-border/70 bg-cinema-surface/60 p-6">
						<h3 class="font-['Space_Grotesk'] text-base font-semibold text-cinema-text">
							Series Facts
						</h3>

						<dl class="mt-4 divide-y divide-cinema-border/50 text-xs">
							<div class="flex justify-between py-2.5">
								<dt class="text-cinema-text-muted">Status</dt>
								<dd class="font-medium text-cinema-text">{tvShow.status || 'Unknown'}</dd>
							</div>
							<div class="flex justify-between py-2.5">
								<dt class="text-cinema-text-muted">Seasons</dt>
								<dd class="font-medium text-cinema-text">{tvShow.numberOfSeasons ?? '—'}</dd>
							</div>
							<div class="flex justify-between py-2.5">
								<dt class="text-cinema-text-muted">Episodes</dt>
								<dd class="font-medium text-cinema-text">{tvShow.numberOfEpisodes ?? '—'}</dd>
							</div>
							<div class="flex justify-between py-2.5">
								<dt class="text-cinema-text-muted">First Air Date</dt>
								<dd class="font-medium text-cinema-text">{tvShow.firstAirDate || '—'}</dd>
							</div>
							{#if tvShow.lastAirDate}
								<div class="flex justify-between py-2.5">
									<dt class="text-cinema-text-muted">Last Air Date</dt>
									<dd class="font-medium text-cinema-text">{tvShow.lastAirDate}</dd>
								</div>
							{/if}
							{#if tvShow.episodeRuntime}
								<div class="flex justify-between py-2.5">
									<dt class="text-cinema-text-muted">Episode Runtime</dt>
									<dd class="font-medium text-cinema-text">{tvShow.episodeRuntime}</dd>
								</div>
							{/if}
							{#if tvShow.contentRating}
								<div class="flex justify-between py-2.5">
									<dt class="text-cinema-text-muted">Content Rating</dt>
									<dd class="font-medium text-cinema-text">{tvShow.contentRating}</dd>
								</div>
							{/if}
							{#if tvShow.homepage}
								<div class="flex justify-between py-2.5">
									<dt class="text-cinema-text-muted">Official Site</dt>
									<dd>
										<a
											href={tvShow.homepage}
											target="_blank"
											rel="noopener noreferrer"
											class="inline-flex items-center gap-1 text-cinema-accent hover:underline"
										>
											<span>Visit</span>
											<ExternalLink class="h-3 w-3" />
										</a>
									</dd>
								</div>
							{/if}
						</dl>
					</div>
				</div>
			</div>
		</section>

		<!-- Section 2: Seasons and Episodes Overview -->
		{#if tvShow.seasons && tvShow.seasons.length > 0}
			<section id="seasons" class="mb-14" aria-label="Available Seasons">
				<div class="mb-6 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div
							class="flex h-7 w-7 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface text-cinema-accent"
						>
							<Layers class="h-4 w-4" />
						</div>
						<h2 class="font-['Space_Grotesk'] text-xl font-bold text-cinema-text sm:text-2xl">
							Seasons ({tvShow.seasons.length})
						</h2>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each tvShow.seasons as season (season.id)}
						<article
							class="group relative flex overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cinema-accent/50 hover:bg-cinema-elevated"
						>
							<!-- Season Poster -->
							<div class="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-xl bg-cinema-muted">
								{#if season.posterUrl}
									<img
										src={season.posterUrl}
										alt={season.name}
										loading="lazy"
										class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center text-cinema-text-muted">
										<Tv class="h-6 w-6" />
									</div>
								{/if}
							</div>

							<!-- Season Information -->
							<div class="ml-4 flex min-w-0 flex-1 flex-col justify-between">
								<div>
									<h3 class="font-['Space_Grotesk'] text-base font-bold text-cinema-text group-hover:text-cinema-accent">
										<a
											href="/tv/{tvShow.id}/season/{season.seasonNumber}"
											class="focus-visible:underline focus-visible:outline-none"
										>
											{season.name}
										</a>
									</h3>
									<div class="mt-1 flex items-center gap-2 text-xs text-cinema-text-muted">
										{#if season.airYear}
											<span>{season.airYear}</span>
											<span>•</span>
										{/if}
										<span>{season.episodeCount} Episodes</span>
									</div>
									{#if season.overview}
										<p class="mt-2 line-clamp-2 text-xs text-cinema-text-muted">
											{season.overview}
										</p>
									{/if}
								</div>

								<div class="mt-3">
									<a
										href="/tv/{tvShow.id}/season/{season.seasonNumber}"
										class="inline-flex items-center gap-1 text-xs font-semibold text-cinema-accent hover:underline focus-visible:outline-none"
									>
										<span>View Season Episodes</span>
										<span>→</span>
									</a>
								</div>
							</div>
						</article>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Section 3: Cast -->
		{#if tvShow.cast && tvShow.cast.length > 0}
			<section class="mb-14" aria-label="Series Cast">
				<div class="mb-6 flex items-center gap-2">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface text-cinema-accent"
					>
						<Tv class="h-4 w-4" />
					</div>
					<h2 class="font-['Space_Grotesk'] text-xl font-bold text-cinema-text sm:text-2xl">
						Series Cast
					</h2>
				</div>

				<div class="custom-scrollbar flex gap-4 overflow-x-auto pb-4">
					{#each tvShow.cast as member (member.id)}
						<a
							href="/person/{member.id}"
							class="group flex w-32 shrink-0 flex-col items-center text-center focus-visible:outline-none"
						>
							<div
								class="h-28 w-28 overflow-hidden rounded-full border border-cinema-border bg-cinema-muted shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:border-cinema-accent/60"
							>
								{#if member.profileUrl}
									<img
										src={member.profileUrl}
										alt={member.name}
										loading="lazy"
										class="h-full w-full object-cover"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center text-cinema-text-muted">
										<Tv class="h-8 w-8" />
									</div>
								{/if}
							</div>
							<h3 class="mt-2 line-clamp-1 text-xs font-semibold text-cinema-text group-hover:text-cinema-accent">
								{member.name}
							</h3>
							<p class="line-clamp-1 text-[11px] text-cinema-text-muted">
								{member.character}
							</p>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Section 4: TV Artwork Gallery -->
		<section id="gallery" class="mb-14" aria-label="TV Promotional Artwork Gallery">
			<MovieArtworkGallery {gallery} movieTitle={tvShow.name} />
		</section>

		<!-- Section 5: Similar TV Series -->
		{#if similar.items && similar.items.length > 0}
			<section class="mb-14" aria-label="Similar TV Series">
				<div class="mb-6 flex items-center gap-2">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface text-cinema-accent"
					>
						<Tv class="h-4 w-4" />
					</div>
					<h2 class="font-['Space_Grotesk'] text-xl font-bold text-cinema-text sm:text-2xl">
						Similar TV Series
					</h2>
				</div>

				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-4">
					{#each similar.items.slice(0, 8) as show (show.id)}
						<TVCard {show} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Section 6: Recommendations -->
		{#if recommendations.items && recommendations.items.length > 0}
			<section class="mb-14" aria-label="Recommended TV Series">
				<div class="mb-6 flex items-center gap-2">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface text-cinema-accent"
					>
						<Sparkles class="h-4 w-4" />
					</div>
					<h2 class="font-['Space_Grotesk'] text-xl font-bold text-cinema-text sm:text-2xl">
						Recommended for You
					</h2>
				</div>

				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-4">
					{#each recommendations.items.slice(0, 8) as show (show.id)}
						<TVCard {show} />
					{/each}
				</div>
			</section>
		{/if}
	</main>

	<!-- Trailer Modal -->
	{#if tvShow.trailer}
		<TrailerModal
			open={trailerModalOpen}
			trailer={tvShow.trailer}
			movieTitle={tvShow.name}
			onclose={closeTrailer}
		/>
	{/if}
</div>
