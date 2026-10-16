<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import type { PersonCreditMovie } from '#lib/types/person';
	import MovieCard from '#lib/components/movie/MovieCard.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import SectionError from '#lib/components/ui/SectionError.svelte';
	import {
		ArrowLeft,
		User,
		Calendar,
		MapPin,
		Film,
		ExternalLink,
		Clapperboard,
		Sparkles,
		PenTool,
		Award,
		Video
	} from 'lucide-svelte';

	let { data }: PageProps = $props();
	let person = $derived(data.person);
	let creditsError = $derived(data.creditsError);

	// Image error state
	let profileImageError = $state(false);

	// Biography expand/collapse
	let isBioExpanded = $state(false);
	const BIO_CHAR_LIMIT = 360;
	let hasLongBio = $derived(person.biography && person.biography.length > BIO_CHAR_LIMIT);
	let displayBio = $derived(
		!hasLongBio || isBioExpanded
			? person.biography
			: `${person.biography.slice(0, BIO_CHAR_LIMIT).trim()}...`
	);

	type RoleCategory = 'acting' | 'directing' | 'writing' | 'producing' | 'cinematography' | 'other';

	interface RoleTab {
		id: RoleCategory;
		label: string;
		count: number;
		credits: PersonCreditMovie[];
		icon: typeof User;
		defaultSubtitle: string;
	}

	let roleTabs = $derived<RoleTab[]>([
		{
			id: 'acting',
			label: 'Acting',
			count: person.actingCredits?.length || 0,
			credits: person.actingCredits || [],
			icon: User,
			defaultSubtitle: 'Cast'
		},
		{
			id: 'directing',
			label: 'Directing',
			count: person.directingCredits?.length || 0,
			credits: person.directingCredits || [],
			icon: Clapperboard,
			defaultSubtitle: 'Director'
		},
		{
			id: 'writing',
			label: 'Writing',
			count: person.writingCredits?.length || 0,
			credits: person.writingCredits || [],
			icon: PenTool,
			defaultSubtitle: 'Screenplay / Writer'
		},
		{
			id: 'producing',
			label: 'Producing',
			count: person.producingCredits?.length || 0,
			credits: person.producingCredits || [],
			icon: Award,
			defaultSubtitle: 'Producer'
		},
		{
			id: 'cinematography',
			label: 'Cinematography',
			count: person.cinematographyCredits?.length || 0,
			credits: person.cinematographyCredits || [],
			icon: Video,
			defaultSubtitle: 'Cinematographer'
		},
		{
			id: 'other',
			label: 'Other Crew',
			count: person.otherCrewCredits?.length || 0,
			credits: person.otherCrewCredits || [],
			icon: Film,
			defaultSubtitle: 'Crew'
		}
	]);

	// Filter available roles with at least 1 credit
	let availableRoles = $derived(roleTabs.filter((r) => r.count > 0));

	// Active filmography category tab
	let userSelectedCategory = $state<RoleCategory | null>(null);

	let activeCategory = $derived.by<RoleCategory>(() => {
		if (
			userSelectedCategory &&
			roleTabs.some((r) => r.id === userSelectedCategory && r.count > 0)
		) {
			return userSelectedCategory;
		}
		const dept = (person.knownForDepartment || '').toLowerCase();
		if (dept.includes('direct') && (person.directingCredits?.length ?? 0) > 0) return 'directing';
		if (dept.includes('writ') && (person.writingCredits?.length ?? 0) > 0) return 'writing';
		if (dept.includes('produc') && (person.producingCredits?.length ?? 0) > 0) return 'producing';
		if (
			(dept.includes('camera') || dept.includes('cinemat')) &&
			(person.cinematographyCredits?.length ?? 0) > 0
		)
			return 'cinematography';
		if ((person.actingCredits?.length ?? 0) > 0) return 'acting';
		if (availableRoles.length > 0) return availableRoles[0].id;
		return 'acting';
	});

	let currentTab = $derived(roleTabs.find((r) => r.id === activeCategory) || roleTabs[0]);

	// Filmography pagination / show more
	let showAllCredits = $state(false);
	const INITIAL_CREDITS_LIMIT = 16;

	let currentCredits = $derived(currentTab.credits);

	let visibleCredits = $derived(
		showAllCredits ? currentCredits : currentCredits.slice(0, INITIAL_CREDITS_LIMIT)
	);

	// Reset showAllCredits when category changes
	function selectCategory(category: RoleCategory) {
		userSelectedCategory = category;
		showAllCredits = false;
	}

	let canonicalUrl = $derived(page.url.href);
	let metaDescription = $derived(
		person.biography
			? person.biography.slice(0, 160).trim()
			: `Explore ${person.name}'s filmography, career credits, and profile on Scenora.`
	);
</script>

<svelte:head>
	<title>{person.name} — Profile & Filmography — Scenora</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph / Social Sharing -->
	<meta property="og:site_name" content="Scenora" />
	<meta property="og:title" content="{person.name} — Profile & Filmography — Scenora" />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:type" content="profile" />
	<meta property="og:url" content={canonicalUrl} />
	{#if person.profileUrl}
		<meta property="og:image" content={person.profileUrl} />
	{/if}

	<!-- Twitter Cards -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="{person.name} — Profile & Filmography — Scenora" />
	<meta name="twitter:description" content={metaDescription} />
	{#if person.profileUrl}
		<meta name="twitter:image" content={person.profileUrl} />
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

	<!-- Cinematic Person Profile Header Section -->
	<section
		class="relative mt-4 w-full border-b border-cinema-border bg-cinema-surface/40 py-8 sm:py-12 lg:py-16"
		aria-label="Person Profile Overview"
	>
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex flex-col items-center gap-8 md:flex-row md:items-start lg:gap-12">
				<!-- Profile Portrait (3:4 aspect ratio) -->
				<div
					class="w-44 flex-shrink-0 overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-xl sm:w-52 md:w-60 lg:w-64"
				>
					<div class="relative aspect-[3/4] w-full overflow-hidden bg-cinema-elevated">
						{#if person.profileUrl && !profileImageError}
							<img
								src={person.profileUrl}
								alt="Portrait of {person.name}"
								fetchpriority="high"
								loading="eager"
								onerror={() => (profileImageError = true)}
								class="h-full w-full object-cover object-top"
							/>
						{:else}
							<div
								class="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-cinema-surface to-cinema-elevated p-4 text-center text-cinema-text-muted"
							>
								<div
									class="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-cinema-border bg-cinema-bg text-cinema-accent"
								>
									<User class="h-8 w-8" />
								</div>
								<span class="font-['Space_Grotesk'] text-sm font-bold text-cinema-text">
									{person.name}
								</span>
								<span class="mt-1 text-xs text-cinema-text-muted">Photo Unavailable</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Person Details and Biography -->
				<div class="max-w-3xl flex-1 text-center md:text-left">
					<!-- Department & Role Badges -->
					<div class="flex flex-wrap items-center justify-center gap-2 md:justify-start">
						{#if person.knownForDepartment}
							<div
								class="inline-flex items-center gap-1.5 rounded-full border border-cinema-border bg-cinema-surface px-3 py-1 text-xs font-semibold text-cinema-accent shadow-xs"
							>
								<Sparkles class="h-3 w-3" />
								<span>{person.knownForDepartment}</span>
							</div>
						{/if}

						<div
							class="inline-flex items-center gap-1.5 rounded-full border border-cinema-border/70 bg-cinema-elevated/70 px-3 py-1 text-xs font-medium text-cinema-text-muted shadow-xs"
						>
							<Film class="h-3 w-3" />
							<span
								>{person.totalCreditsCount} Cataloged Title{person.totalCreditsCount === 1
									? ''
									: 's'}</span
							>
						</div>
					</div>

					<!-- Person Name -->
					<h1
						class="mt-4 font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-cinema-text sm:text-4xl lg:text-5xl"
					>
						{person.name}
					</h1>

					<!-- Vital Statistics: Born, Died, Place of Birth -->
					<div
						class="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-cinema-text-muted sm:text-sm md:justify-start"
					>
						{#if person.birthdayFormatted}
							<div class="flex items-center gap-1.5">
								<Calendar class="h-3.5 w-3.5 text-cinema-accent" />
								<span>
									Born {person.birthdayFormatted}
									{#if person.age && !person.deathdayFormatted}
										<span class="font-medium text-cinema-text">({person.age} years old)</span>
									{/if}
								</span>
							</div>
						{/if}

						{#if person.deathdayFormatted}
							<div class="flex items-center gap-1.5 text-cinema-text-muted">
								<span>&bull;</span>
								<span>
									Died {person.deathdayFormatted}
									{#if person.age}
										<span class="font-medium text-cinema-text">(aged {person.age})</span>
									{/if}
								</span>
							</div>
						{/if}

						{#if person.placeOfBirth}
							<div class="flex items-center gap-1.5">
								{#if person.birthdayFormatted}
									<span>&bull;</span>
								{/if}
								<MapPin class="h-3.5 w-3.5 text-cinema-accent" />
								<span>{person.placeOfBirth}</span>
							</div>
						{/if}
					</div>

					<!-- Biography -->
					<div class="mt-6 text-sm leading-relaxed text-cinema-text/90 sm:text-base">
						{#if person.biography}
							<p class="whitespace-pre-line">
								{displayBio}
							</p>
							{#if hasLongBio}
								<button
									type="button"
									onclick={() => (isBioExpanded = !isBioExpanded)}
									aria-expanded={isBioExpanded}
									class="mt-2 inline-flex items-center text-xs font-semibold text-cinema-accent transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
								>
									{isBioExpanded ? 'Read Less' : 'Read Full Biography'}
								</button>
							{/if}
						{:else}
							<p class="text-sm text-cinema-text-muted italic">
								No biography is currently cataloged for this person.
							</p>
						{/if}
					</div>

					<!-- External Links -->
					{#if person.imdbId || person.homepage}
						<div
							class="mt-6 flex flex-wrap items-center justify-center gap-3 pt-2 md:justify-start"
						>
							{#if person.imdbId}
								<a
									href="https://www.imdb.com/name/{person.imdbId}/"
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface px-4 py-2 text-xs font-semibold text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/50 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
								>
									<span>IMDb Profile</span>
									<ExternalLink class="h-3.5 w-3.5 text-cinema-text-muted" />
								</a>
							{/if}

							{#if person.homepage}
								<a
									href={person.homepage}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface px-4 py-2 text-xs font-semibold text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/50 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
								>
									<span>Official Website</span>
									<ExternalLink class="h-3.5 w-3.5 text-cinema-text-muted" />
								</a>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- Main Content: Filmography Section -->
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<!-- Section Header with Category Tabs -->
		<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="font-['Space_Grotesk'] text-2xl font-bold text-cinema-text sm:text-3xl">
					Filmography
				</h2>
				<p class="mt-1 text-xs text-cinema-text-muted">
					Cinematic works and productions associated with {person.name}
				</p>
			</div>

			<!-- Role Category Filter Tabs -->
			<div
				class="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface p-1.5 shadow-xs"
				role="tablist"
				aria-label="Filmography Categories"
			>
				{#each availableRoles.length > 0 ? availableRoles : roleTabs.slice(0, 2) as tab (tab.id)}
					{@const IconComponent = tab.icon}
					<button
						type="button"
						role="tab"
						aria-selected={activeCategory === tab.id}
						onclick={() => selectCategory(tab.id)}
						class="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all {activeCategory ===
						tab.id
							? 'bg-cinema-accent text-cinema-accent-foreground shadow-xs'
							: 'text-cinema-text-muted hover:text-cinema-text'}"
					>
						<IconComponent class="h-3.5 w-3.5" />
						<span>{tab.label} ({tab.count})</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Partial Failure Error -->
		{#if creditsError}
			<div class="mb-8">
				<SectionError title="Filmography Notice" message={creditsError} />
			</div>
		{/if}

		<!-- Filmography Grid -->
		{#if currentCredits.length > 0}
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-4">
				{#each visibleCredits as credit (credit.id)}
					<MovieCard
						movie={credit}
						subtitle={activeCategory === 'acting'
							? credit.character
								? `as ${credit.character}`
								: 'Cast'
							: credit.job || currentTab.defaultSubtitle}
					/>
				{/each}
			</div>

			<!-- Show More / Show Less Pagination Button -->
			{#if currentCredits.length > INITIAL_CREDITS_LIMIT}
				<div class="mt-12 flex justify-center">
					<button
						type="button"
						onclick={() => (showAllCredits = !showAllCredits)}
						class="inline-flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-6 py-3 text-xs font-semibold text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
					>
						<span>
							{showAllCredits
								? 'Show Less'
								: `Show All ${currentCredits.length} ${currentTab.label} Titles`}
						</span>
					</button>
				</div>
			{/if}
		{:else}
			<!-- Empty State for Current Category -->
			<EmptyState
				title="No {currentTab.label} Credits Found"
				description="There are currently no {currentTab.label.toLowerCase()} credits cataloged for {person.name}."
			/>
		{/if}
	</div>
</div>
