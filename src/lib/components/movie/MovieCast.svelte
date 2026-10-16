<script lang="ts">
	import type { MovieCastMember, MovieDetail } from '#lib/types/movie';
	import { User, Clapperboard, PenTool, Video, Award } from 'lucide-svelte';

	interface Props {
		cast: MovieCastMember[];
		keyCrew: MovieDetail['keyCrew'];
	}

	let { cast = [], keyCrew }: Props = $props();

	// Set of broken images to fallback gracefully
	let imageErrors = $state<Record<number, boolean>>({});

	// Expand/collapse cast limit
	let showAllCast = $state(false);
	const INITIAL_CAST_LIMIT = 12;

	function handleImageError(id: number) {
		imageErrors[id] = true;
	}

	const hasCast = $derived(cast && cast.length > 0);
	const visibleCast = $derived(showAllCast ? cast : cast.slice(0, INITIAL_CAST_LIMIT));
	const hasDirectors = $derived(keyCrew?.directors && keyCrew.directors.length > 0);
	const hasWriters = $derived(keyCrew?.screenplay && keyCrew.screenplay.length > 0);
	const hasProducers = $derived(keyCrew?.producers && keyCrew.producers.length > 0);
	const hasCinematography = $derived(keyCrew?.cinematography && keyCrew.cinematography.length > 0);
	const hasCrew = $derived(hasDirectors || hasWriters || hasProducers || hasCinematography);
</script>

{#if hasCast || hasCrew}
	<section class="w-full space-y-12" aria-label="Cast and Production Crew">
		<!-- Key Production Crew Highlights -->
		{#if hasCrew}
			<div class="rounded-2xl border border-cinema-border/70 bg-cinema-surface/60 p-6 sm:p-8">
				<h2 class="font-['Space_Grotesk'] text-xl font-bold text-cinema-text sm:text-2xl">
					Key Filmmakers
				</h2>
				<p class="mt-1 text-xs text-cinema-text-muted">
					Creative leadership and technical department leads
				</p>

				<div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{#if hasDirectors}
						<div class="flex flex-col gap-1.5">
							<div
								class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-accent uppercase"
							>
								<Clapperboard class="h-3.5 w-3.5" />
								<span>Director{keyCrew.directors.length > 1 ? 's' : ''}</span>
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
								{:else}
									{keyCrew.directors.join(', ')}
								{/if}
							</p>
						</div>
					{/if}

					{#if hasWriters}
						<div class="flex flex-col gap-1.5">
							<div
								class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-accent uppercase"
							>
								<PenTool class="h-3.5 w-3.5" />
								<span>Screenplay / Writing</span>
							</div>
							<p class="text-sm font-medium text-cinema-text">
								{keyCrew.screenplay.join(', ')}
							</p>
						</div>
					{/if}

					{#if hasProducers}
						<div class="flex flex-col gap-1.5">
							<div
								class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-accent uppercase"
							>
								<Award class="h-3.5 w-3.5" />
								<span>Producer{keyCrew.producers.length > 1 ? 's' : ''}</span>
							</div>
							<p class="text-sm font-medium text-cinema-text">
								{keyCrew.producers.join(', ')}
							</p>
						</div>
					{/if}

					{#if hasCinematography}
						<div class="flex flex-col gap-1.5">
							<div
								class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-accent uppercase"
							>
								<Video class="h-3.5 w-3.5" />
								<span>Cinematography</span>
							</div>
							<p class="text-sm font-medium text-cinema-text">
								{keyCrew.cinematography.join(', ')}
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
	</section>
{/if}
