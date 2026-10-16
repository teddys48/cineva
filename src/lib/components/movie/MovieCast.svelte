<script lang="ts">
	import type { MovieCastMember, MovieCrewMember, MovieDetail } from '#lib/types/movie';
	import {
		User,
		Clapperboard,
		PenTool,
		Video,
		Award,
		Music,
		Scissors,
		Palette,
		ChevronDown,
		ChevronUp,
		Users
	} from 'lucide-svelte';

	interface Props {
		cast: MovieCastMember[];
		keyCrew: MovieDetail['keyCrew'];
		crew?: MovieCrewMember[];
	}

	let { cast = [], keyCrew, crew = [] }: Props = $props();

	// Set of broken images to fallback gracefully
	let imageErrors = $state<Record<number, boolean>>({});

	// Expand/collapse cast limit
	let showAllCast = $state(false);
	const INITIAL_CAST_LIMIT = 12;

	// Expand/collapse full crew directory
	let showFullCrew = $state(false);

	function handleImageError(id: number) {
		imageErrors[id] = true;
	}

	const hasCast = $derived(cast && cast.length > 0);
	const visibleCast = $derived(showAllCast ? cast : cast.slice(0, INITIAL_CAST_LIMIT));

	const hasDirectors = $derived(
		(keyCrew?.directorsList && keyCrew.directorsList.length > 0) ||
			(keyCrew?.directors && keyCrew.directors.length > 0)
	);
	const hasWriters = $derived(
		(keyCrew?.screenplayList && keyCrew.screenplayList.length > 0) ||
			(keyCrew?.screenplay && keyCrew.screenplay.length > 0)
	);
	const hasProducers = $derived(
		(keyCrew?.producersList && keyCrew.producersList.length > 0) ||
			(keyCrew?.producers && keyCrew.producers.length > 0)
	);
	const hasCinematography = $derived(
		(keyCrew?.cinematographyList && keyCrew.cinematographyList.length > 0) ||
			(keyCrew?.cinematography && keyCrew.cinematography.length > 0)
	);
	const hasComposers = $derived(
		Boolean(keyCrew?.composersList && keyCrew.composersList.length > 0)
	);
	const hasEditors = $derived(Boolean(keyCrew?.editorsList && keyCrew.editorsList.length > 0));
	const hasProductionDesign = $derived(
		Boolean(keyCrew?.productionDesignList && keyCrew.productionDesignList.length > 0)
	);
	const hasCostumeDesign = $derived(
		Boolean(keyCrew?.costumeDesignList && keyCrew.costumeDesignList.length > 0)
	);
	const hasArtDirection = $derived(
		Boolean(keyCrew?.artDirectionList && keyCrew.artDirectionList.length > 0)
	);

	const hasKeyCrew = $derived(
		hasDirectors ||
			hasWriters ||
			hasProducers ||
			hasCinematography ||
			hasComposers ||
			hasEditors ||
			hasProductionDesign ||
			hasCostumeDesign ||
			hasArtDirection
	);

	// Group crew by department for organized directory
	const crewByDepartment = $derived.by(() => {
		if (!crew || crew.length === 0) return {};
		const groups: Record<string, MovieCrewMember[]> = {};
		for (const member of crew) {
			const dept = member.department || 'Production';
			if (!groups[dept]) groups[dept] = [];
			groups[dept].push(member);
		}
		return groups;
	});

	const departments = $derived(Object.keys(crewByDepartment).sort());
</script>

{#if hasCast || hasKeyCrew || crew.length > 0}
	<section class="w-full space-y-12" aria-label="Cast and Production Crew">
		<!-- Key Production Crew Highlights -->
		{#if hasKeyCrew}
			<div class="rounded-2xl border border-cinema-border/70 bg-cinema-surface/60 p-6 sm:p-8">
				<div class="flex items-baseline justify-between">
					<div>
						<h2 class="font-['Space_Grotesk'] text-xl font-bold text-cinema-text sm:text-2xl">
							Key Filmmakers
						</h2>
						<p class="mt-1 text-xs text-cinema-text-muted">
							Creative leadership and technical department heads
						</p>
					</div>
				</div>

				<div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
					<!-- Directors -->
					{#if hasDirectors}
						<div class="flex flex-col gap-1.5">
							<div
								class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-accent uppercase"
							>
								<Clapperboard class="h-3.5 w-3.5" />
								<span>Director{(keyCrew.directors?.length ?? 1) > 1 ? 's' : ''}</span>
							</div>
							<p class="text-sm font-medium text-cinema-text">
								{#if keyCrew.directorsList && keyCrew.directorsList.length > 0}
									{#each keyCrew.directorsList as director, idx (director.id)}
										{#if idx > 0},
										{/if}
										<a
											href="/person/{director.id}"
											class="transition-colors hover:text-cinema-accent hover:underline focus-visible:rounded-xs focus-visible:ring-1 focus-visible:ring-cinema-accent focus-visible:outline-none"
										>
											{director.name}
										</a>
									{/each}
								{:else if keyCrew.directors}
									{keyCrew.directors.join(', ')}
								{/if}
							</p>
						</div>
					{/if}

					<!-- Writers & Screenplay -->
					{#if hasWriters}
						<div class="flex flex-col gap-1.5">
							<div
								class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-accent uppercase"
							>
								<PenTool class="h-3.5 w-3.5" />
								<span>Screenplay / Writing</span>
							</div>
							<p class="text-sm font-medium text-cinema-text">
								{#if keyCrew.screenplayList && keyCrew.screenplayList.length > 0}
									{#each keyCrew.screenplayList as writer, idx (writer.id)}
										{#if idx > 0},
										{/if}
										<a
											href="/person/{writer.id}"
											class="transition-colors hover:text-cinema-accent hover:underline focus-visible:rounded-xs focus-visible:ring-1 focus-visible:ring-cinema-accent focus-visible:outline-none"
										>
											{writer.name}
										</a>
									{/each}
								{:else if keyCrew.screenplay}
									{keyCrew.screenplay.join(', ')}
								{/if}
							</p>
						</div>
					{/if}

					<!-- Producers -->
					{#if hasProducers}
						<div class="flex flex-col gap-1.5">
							<div
								class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-accent uppercase"
							>
								<Award class="h-3.5 w-3.5" />
								<span>Producer{(keyCrew.producers?.length ?? 1) > 1 ? 's' : ''}</span>
							</div>
							<p class="text-sm font-medium text-cinema-text">
								{#if keyCrew.producersList && keyCrew.producersList.length > 0}
									{#each keyCrew.producersList as producer, idx (producer.id)}
										{#if idx > 0},
										{/if}
										<a
											href="/person/{producer.id}"
											class="transition-colors hover:text-cinema-accent hover:underline focus-visible:rounded-xs focus-visible:ring-1 focus-visible:ring-cinema-accent focus-visible:outline-none"
										>
											{producer.name}
										</a>
									{/each}
								{:else if keyCrew.producers}
									{keyCrew.producers.join(', ')}
								{/if}
							</p>
						</div>
					{/if}

					<!-- Cinematography -->
					{#if hasCinematography}
						<div class="flex flex-col gap-1.5">
							<div
								class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-accent uppercase"
							>
								<Video class="h-3.5 w-3.5" />
								<span>Cinematography</span>
							</div>
							<p class="text-sm font-medium text-cinema-text">
								{#if keyCrew.cinematographyList && keyCrew.cinematographyList.length > 0}
									{#each keyCrew.cinematographyList as dp, idx (dp.id)}
										{#if idx > 0},
										{/if}
										<a
											href="/person/{dp.id}"
											class="transition-colors hover:text-cinema-accent hover:underline focus-visible:rounded-xs focus-visible:ring-1 focus-visible:ring-cinema-accent focus-visible:outline-none"
										>
											{dp.name}
										</a>
									{/each}
								{:else if keyCrew.cinematography}
									{keyCrew.cinematography.join(', ')}
								{/if}
							</p>
						</div>
					{/if}

					<!-- Original Music Composer -->
					{#if hasComposers && keyCrew.composersList}
						<div class="flex flex-col gap-1.5">
							<div
								class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-accent uppercase"
							>
								<Music class="h-3.5 w-3.5" />
								<span>Original Score / Music</span>
							</div>
							<p class="text-sm font-medium text-cinema-text">
								{#each keyCrew.composersList as composer, idx (composer.id)}
									{#if idx > 0},
									{/if}
									<a
										href="/person/{composer.id}"
										class="transition-colors hover:text-cinema-accent hover:underline focus-visible:rounded-xs focus-visible:ring-1 focus-visible:ring-cinema-accent focus-visible:outline-none"
									>
										{composer.name}
									</a>
								{/each}
							</p>
						</div>
					{/if}

					<!-- Film Editing -->
					{#if hasEditors && keyCrew.editorsList}
						<div class="flex flex-col gap-1.5">
							<div
								class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-accent uppercase"
							>
								<Scissors class="h-3.5 w-3.5" />
								<span>Film Editing</span>
							</div>
							<p class="text-sm font-medium text-cinema-text">
								{#each keyCrew.editorsList as editor, idx (editor.id)}
									{#if idx > 0},
									{/if}
									<a
										href="/person/{editor.id}"
										class="transition-colors hover:text-cinema-accent hover:underline focus-visible:rounded-xs focus-visible:ring-1 focus-visible:ring-cinema-accent focus-visible:outline-none"
									>
										{editor.name}
									</a>
								{/each}
							</p>
						</div>
					{/if}

					<!-- Production Design -->
					{#if hasProductionDesign && keyCrew.productionDesignList}
						<div class="flex flex-col gap-1.5">
							<div
								class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-accent uppercase"
							>
								<Palette class="h-3.5 w-3.5" />
								<span>Production Design</span>
							</div>
							<p class="text-sm font-medium text-cinema-text">
								{#each keyCrew.productionDesignList as designer, idx (designer.id)}
									{#if idx > 0},
									{/if}
									<a
										href="/person/{designer.id}"
										class="transition-colors hover:text-cinema-accent hover:underline focus-visible:rounded-xs focus-visible:ring-1 focus-visible:ring-cinema-accent focus-visible:outline-none"
									>
										{designer.name}
									</a>
								{/each}
							</p>
						</div>
					{/if}

					<!-- Costume Design -->
					{#if hasCostumeDesign && keyCrew.costumeDesignList}
						<div class="flex flex-col gap-1.5">
							<div
								class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-accent uppercase"
							>
								<Palette class="h-3.5 w-3.5" />
								<span>Costume Design</span>
							</div>
							<p class="text-sm font-medium text-cinema-text">
								{#each keyCrew.costumeDesignList as costume, idx (costume.id)}
									{#if idx > 0},
									{/if}
									<a
										href="/person/{costume.id}"
										class="transition-colors hover:text-cinema-accent hover:underline focus-visible:rounded-xs focus-visible:ring-1 focus-visible:ring-cinema-accent focus-visible:outline-none"
									>
										{costume.name}
									</a>
								{/each}
							</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Featured Principal Cast -->
		{#if hasCast}
			<div>
				<div class="mb-6 flex items-baseline justify-between">
					<div>
						<h2 class="font-['Space_Grotesk'] text-xl font-bold text-cinema-text sm:text-2xl">
							Principal Cast
						</h2>
						<p class="mt-1 text-xs text-cinema-text-muted">
							Starring talent and principal ensemble
						</p>
					</div>
					<span class="font-mono text-xs text-cinema-text-muted">
						{cast.length} member{cast.length === 1 ? '' : 's'}
					</span>
				</div>

				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
					{#each visibleCast as member (member.id)}
						<a
							href="/person/{member.id}"
							class="group flex flex-col overflow-hidden rounded-xl border border-cinema-border bg-cinema-surface shadow-xs transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
							aria-label="View profile for {member.name}"
						>
							<!-- Aspect Ratio 3:4 for Actor Headshot -->
							<div class="relative aspect-[3/4] w-full overflow-hidden bg-cinema-elevated">
								{#if member.profileUrl && !imageErrors[member.id]}
									<img
										src={member.profileUrl}
										alt="Portrait of {member.name}"
										loading="lazy"
										onerror={() => handleImageError(member.id)}
										class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								{:else}
									<div
										class="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-cinema-surface to-cinema-elevated p-2 text-cinema-text-muted"
									>
										<div
											class="flex h-12 w-12 items-center justify-center rounded-full border border-cinema-border bg-cinema-bg text-cinema-accent"
										>
											<User class="h-6 w-6" />
										</div>
									</div>
								{/if}
							</div>

							<!-- Actor and Role Info -->
							<div class="flex flex-1 flex-col p-3">
								<span
									class="line-clamp-1 font-['Space_Grotesk'] text-xs font-semibold text-cinema-text transition-colors group-hover:text-cinema-accent sm:text-sm"
									title={member.name}
								>
									{member.name}
								</span>
								{#if member.character}
									<span
										class="mt-0.5 line-clamp-1 text-[11px] text-cinema-text-muted sm:text-xs"
										title={member.character}
									>
										{member.character}
									</span>
								{/if}
							</div>
						</a>
					{/each}
				</div>

				{#if cast.length > INITIAL_CAST_LIMIT}
					<div class="mt-8 flex justify-center">
						<button
							type="button"
							onclick={() => (showAllCast = !showAllCast)}
							class="inline-flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-5 py-2.5 text-xs font-semibold text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
						>
							<span>{showAllCast ? 'Show Less Cast' : `Show All Cast (${cast.length})`}</span>
						</button>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Complete Production Crew Directory -->
		{#if crew && crew.length > 0}
			<div class="rounded-2xl border border-cinema-border/70 bg-cinema-surface/40 p-6 sm:p-8">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h3 class="font-['Space_Grotesk'] text-lg font-bold text-cinema-text sm:text-xl">
							Complete Production Crew
						</h3>
						<p class="mt-0.5 text-xs text-cinema-text-muted">
							Catalog of {crew.length} credited filmmakers across {departments.length} departments
						</p>
					</div>

					<button
						type="button"
						onclick={() => (showFullCrew = !showFullCrew)}
						aria-expanded={showFullCrew}
						class="inline-flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-4 py-2 text-xs font-semibold text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
					>
						<Users class="h-3.5 w-3.5 text-cinema-accent" />
						<span>{showFullCrew ? 'Hide Crew Directory' : 'Explore Full Crew Directory'}</span>
						{#if showFullCrew}
							<ChevronUp class="h-3.5 w-3.5" />
						{:else}
							<ChevronDown class="h-3.5 w-3.5" />
						{/if}
					</button>
				</div>

				{#if showFullCrew}
					<div class="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
						{#each departments as dept (dept)}
							<div class="rounded-xl border border-cinema-border/60 bg-cinema-surface/70 p-4">
								<h4
									class="border-b border-cinema-border/60 pb-2 text-xs font-bold tracking-wider text-cinema-accent uppercase"
								>
									{dept} ({crewByDepartment[dept].length})
								</h4>
								<ul class="mt-3 divide-y divide-cinema-border/40 text-xs">
									{#each crewByDepartment[dept] as member (member.id + ':' + member.job)}
										<li class="flex items-center justify-between py-2">
											<a
												href="/person/{member.id}"
												class="font-medium text-cinema-text transition-colors hover:text-cinema-accent hover:underline focus-visible:rounded-xs focus-visible:ring-1 focus-visible:ring-cinema-accent focus-visible:outline-none"
											>
												{member.name}
											</a>
											<span
												class="max-w-[140px] truncate text-right text-[11px] text-cinema-text-muted"
												title={member.job}
											>
												{member.job}
											</span>
										</li>
									{/each}
								</ul>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</section>
{/if}
