<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import {
		ArrowLeft,
		Calendar,
		Clock,
		Star,
		Tv,
		Layers,
		User,
		ChevronDown
	} from 'lucide-svelte';

	let { data }: PageProps = $props();
	let season = $derived(data.season);
	let series = $derived(data.series);

	let canonicalUrl = $derived(page.url.href);
	let pageTitle = $derived(
		`${season.name} — ${series.name} — Cineva`
	);
	let metaDescription = $derived(
		season.overview ||
			`Explore all ${season.episodes.length} episodes of ${season.name} of ${series.name} on Cineva.`
	);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph -->
	<meta property="og:site_name" content="Cineva" />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:type" content="video.tv_show" />
	<meta property="og:url" content={canonicalUrl} />
	{#if season.posterUrl}
		<meta property="og:image" content={season.posterUrl} />
	{/if}

	<!-- Twitter Cards -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={metaDescription} />
	{#if season.posterUrl}
		<meta name="twitter:image" content={season.posterUrl} />
	{/if}
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Top Navigation Breadcrumbs Back to Series -->
	<nav class="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-cinema-text-muted">
		<a
			href="/tv/{series.id}"
			class="inline-flex items-center gap-1.5 rounded-lg py-1 text-cinema-text-muted transition-colors hover:text-cinema-accent focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
		>
			<ArrowLeft class="h-3.5 w-3.5" />
			<span>{series.name}</span>
		</a>
		<span>/</span>
		<span class="text-cinema-text">{season.name}</span>
	</nav>

	<!-- Season Header Banner -->
	<header
		class="relative mb-12 flex flex-col gap-6 rounded-2xl border border-cinema-border bg-cinema-surface/70 p-6 shadow-sm md:flex-row md:items-start md:gap-8 lg:p-8"
	>
		<!-- Season Poster -->
		<div class="mx-auto w-36 shrink-0 sm:w-44 md:mx-0">
			<div class="aspect-[2/3] w-full overflow-hidden rounded-xl border border-cinema-border bg-cinema-muted shadow-md">
				{#if season.posterUrl}
					<img
						src={season.posterUrl}
						alt="Poster for {season.name}"
						class="h-full w-full object-cover"
					/>
				{:else}
					<div class="flex h-full w-full items-center justify-center text-cinema-text-muted">
						<Tv class="h-10 w-10 text-cinema-accent" />
					</div>
				{/if}
			</div>
		</div>

		<!-- Season Info & Season Switcher -->
		<div class="flex min-w-0 flex-1 flex-col justify-between">
			<div>
				<div class="flex flex-wrap items-center gap-2">
					<span
						class="rounded-md border border-cinema-border/50 bg-cinema-bg/80 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-cinema-accent uppercase shadow-xs"
					>
						{season.seasonNumber === 0 ? 'Specials' : `Season ${season.seasonNumber}`}
					</span>

					{#if season.airYear}
						<span class="text-xs text-cinema-text-muted">
							Released {season.airYear}
						</span>
					{/if}
				</div>

				<h1 class="mt-2 font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-cinema-text sm:text-3xl lg:text-4xl">
					{season.name}
				</h1>

				<p class="mt-1 text-sm font-medium text-cinema-text-muted">
					Part of <a href="/tv/{series.id}" class="text-cinema-accent hover:underline">{series.name}</a>
				</p>

				<div class="mt-3 flex items-center gap-4 text-xs font-medium text-cinema-text-muted">
					<div class="flex items-center gap-1.5">
						<Layers class="h-3.5 w-3.5 text-cinema-accent" />
						<span>{season.episodes.length} Episodes</span>
					</div>
					{#if season.airDate}
						<div class="flex items-center gap-1.5">
							<Calendar class="h-3.5 w-3.5 text-cinema-accent" />
							<span>{season.airDate}</span>
						</div>
					{/if}
				</div>

				{#if season.overview}
					<p class="mt-4 max-w-3xl text-sm leading-relaxed text-cinema-text/90">
						{season.overview}
					</p>
				{/if}
			</div>

			<!-- Quick Season Selector if series has multiple seasons -->
			{#if series.seasons && series.seasons.length > 1}
				<div class="mt-6 flex flex-wrap items-center gap-2 border-t border-cinema-border/50 pt-4">
					<span class="text-xs font-medium text-cinema-text-muted">All Seasons:</span>
					{#each series.seasons as s (s.id)}
						<a
							href="/tv/{series.id}/season/{s.seasonNumber}"
							class="rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors {s.seasonNumber === season.seasonNumber
								? 'bg-cinema-accent text-cinema-accent-foreground'
								: 'border border-cinema-border bg-cinema-surface text-cinema-text hover:border-cinema-accent/50 hover:bg-cinema-elevated'}"
						>
							{s.seasonNumber === 0 ? 'Specials' : `S${s.seasonNumber}`}
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</header>

	<!-- Episodes List -->
	<section aria-label="Season Episodes">
		<div class="mb-6 flex items-center justify-between border-b border-cinema-border/50 pb-3">
			<h2 class="font-['Space_Grotesk'] text-xl font-bold text-cinema-text sm:text-2xl">
				Episodes ({season.episodes.length})
			</h2>
		</div>

		<div class="space-y-6">
			{#each season.episodes as ep (ep.id)}
				<article
					id={`episode-${ep.episodeNumber}`}
					class="group overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface p-5 shadow-sm transition-all duration-200 hover:border-cinema-accent/50 hover:bg-cinema-elevated/70"
				>
					<div class="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
						<!-- Episode Still Image (16:9 ratio) -->
						<div class="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-cinema-muted md:w-64 lg:w-72">
							{#if ep.stillUrl}
								<img
									src={ep.stillUrl}
									alt="Still frame from {ep.name}"
									loading="lazy"
									class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
							{:else}
								<div class="flex h-full w-full flex-col items-center justify-center p-3 text-center text-cinema-text-muted">
									<Tv class="h-8 w-8 text-cinema-accent" />
									<span class="mt-1 text-[11px]">Still Unavailable</span>
								</div>
							{/if}

							<!-- Episode Number Tag -->
							<div
								class="absolute top-2 left-2 flex items-center gap-1 rounded-md border border-cinema-border/50 bg-cinema-bg/85 px-2 py-0.5 text-xs font-bold text-cinema-text backdrop-blur-md"
							>
								<span>E{ep.episodeNumber}</span>
							</div>

							{#if ep.rating}
								<div
									class="absolute top-2 right-2 flex items-center gap-1 rounded-md border border-cinema-border/50 bg-cinema-bg/85 px-2 py-0.5 text-xs font-semibold text-cinema-text backdrop-blur-md"
								>
									<Star class="h-3 w-3 fill-cinema-accent text-cinema-accent" />
									<span>{ep.rating.toFixed(1)}</span>
								</div>
							{/if}
						</div>

						<!-- Episode Content -->
						<div class="flex min-w-0 flex-1 flex-col justify-between">
							<div>
								<div class="flex flex-wrap items-baseline gap-2">
									<span class="font-mono text-xs font-bold text-cinema-accent">
										Episode {ep.episodeNumber}
									</span>
									{#if ep.airDateFormatted}
										<span class="text-xs text-cinema-text-muted">
											• {ep.airDateFormatted}
										</span>
									{/if}
									{#if ep.runtime}
										<span class="flex items-center gap-1 text-xs text-cinema-text-muted">
											<Clock class="h-3 w-3" />
											<span>{ep.runtime}</span>
										</span>
									{/if}
								</div>

								<h3 class="mt-1 font-['Space_Grotesk'] text-lg font-bold text-cinema-text group-hover:text-cinema-accent sm:text-xl">
									{ep.name}
								</h3>

								<p class="mt-2 text-xs leading-relaxed text-cinema-text/90 sm:text-sm">
									{ep.overview || 'No overview has been written for this episode.'}
								</p>
							</div>

							<!-- Guest Stars if available -->
							{#if ep.guestStars && ep.guestStars.length > 0}
								<div class="mt-4 border-t border-cinema-border/40 pt-3">
									<div class="flex items-center gap-1.5 text-[11px] font-semibold text-cinema-text-muted uppercase">
										<User class="h-3 w-3 text-cinema-accent" />
										<span>Guest Stars</span>
									</div>
									<div class="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
										{#each ep.guestStars.slice(0, 8) as star, i (star.id)}
											<a
												href="/person/{star.id}"
												class="rounded-md border border-cinema-border bg-cinema-surface px-2 py-0.5 text-[11px] font-medium text-cinema-text hover:border-cinema-accent/50 hover:text-cinema-accent"
											>
												{star.name}
												{#if star.character}
													<span class="text-cinema-text-muted">({star.character})</span>
												{/if}
											</a>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>
				</article>
			{/each}
		</div>
	</section>
</div>
