<script lang="ts">
	import type {
		SearchSuggestionsResponse,
		DiscoveryFilterSuggestion,
		SearchPerson,
		SuggestionMovieItem
	} from '#lib/types/search';
	import {
		Film,
		User,
		Sparkles,
		Star,
		Calendar,
		ArrowRight,
		Clapperboard,
		Compass
	} from 'lucide-svelte';

	export type UnifiedSuggestion =
		| { kind: 'discovery'; item: DiscoveryFilterSuggestion }
		| { kind: 'person'; item: SearchPerson }
		| { kind: 'movie'; item: SuggestionMovieItem };

	let {
		suggestions,
		isOpen,
		activeIndex = -1,
		onSelect,
		onClose
	}: {
		suggestions: SearchSuggestionsResponse;
		isOpen: boolean;
		activeIndex: number;
		onSelect: (suggestion: UnifiedSuggestion) => void;
		onClose?: () => void;
	} = $props();

	let hasResults = $derived(
		(suggestions.discovery?.length ?? 0) > 0 ||
			(suggestions.people?.length ?? 0) > 0 ||
			(suggestions.movies?.length ?? 0) > 0
	);
</script>

{#if isOpen && hasResults}
	<div
		id="search-suggestions-menu"
		role="listbox"
		aria-label="Search suggestions"
		class="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface/95 shadow-2xl backdrop-blur-md transition-all duration-150"
		tabindex="-1"
		onkeydown={(e) => {
			if (e.key === 'Escape') onClose?.();
		}}
	>
		<!-- Category 1: Discovery Filters -->
		{#if suggestions.discovery && suggestions.discovery.length > 0}
			<div class="border-b border-cinema-border/50 p-2">
				<div
					class="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold tracking-wider text-cinema-accent"
				>
					<Sparkles class="h-3 w-3" />
					<span>DISCOVERY FILTERS</span>
				</div>
				<div class="mt-1 flex flex-col gap-1">
					{#each suggestions.discovery as item, i (item.url)}
						{@const globalIndex = i}
						{@const isSelected = activeIndex === globalIndex}
						<button
							type="button"
							role="option"
							aria-selected={isSelected}
							id={`suggestion-item-${globalIndex}`}
							onmousedown={() => onSelect({ kind: 'discovery', item })}
							class="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors {isSelected
								? 'bg-cinema-elevated text-cinema-accent'
								: 'text-cinema-text hover:bg-cinema-elevated/70'}"
						>
							<div class="flex items-center gap-3">
								<div
									class="flex h-8 w-8 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface text-cinema-accent"
								>
									<Compass class="h-4 w-4" />
								</div>
								<div>
									<div class="text-sm font-medium group-hover:text-cinema-accent">
										{item.label}
									</div>
									<div class="text-xs text-cinema-text-muted">
										{item.description}
									</div>
								</div>
							</div>
							<div class="flex items-center gap-2">
								{#if item.badge}
									<span
										class="rounded bg-cinema-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-cinema-accent"
									>
										{item.badge}
									</span>
								{/if}
								<ArrowRight
									class="h-3.5 w-3.5 text-cinema-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-cinema-accent"
								/>
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Category 2: People -->
		{#if suggestions.people && suggestions.people.length > 0}
			<div class="border-b border-cinema-border/50 p-2">
				<div
					class="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold tracking-wider text-cinema-accent"
				>
					<User class="h-3 w-3" />
					<span>PEOPLE</span>
				</div>
				<div class="mt-1 flex flex-col gap-1">
					{#each suggestions.people as person, i (person.id)}
						{@const globalIndex = (suggestions.discovery?.length ?? 0) + i}
						{@const isSelected = activeIndex === globalIndex}
						<button
							type="button"
							role="option"
							aria-selected={isSelected}
							id={`suggestion-item-${globalIndex}`}
							onmousedown={() => onSelect({ kind: 'person', item: person })}
							class="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors {isSelected
								? 'bg-cinema-elevated text-cinema-accent'
								: 'text-cinema-text hover:bg-cinema-elevated/70'}"
						>
							<div class="flex items-center gap-3">
								<div
									class="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-cinema-border bg-cinema-muted"
								>
									{#if person.profileUrl}
										<img
											src={person.profileUrl}
											alt={person.name}
											class="h-full w-full object-cover"
										/>
									{:else}
										<div
											class="flex h-full w-full items-center justify-center text-cinema-text-muted"
										>
											<User class="h-4 w-4" />
										</div>
									{/if}
								</div>
								<div class="min-w-0">
									<div class="truncate text-sm font-medium group-hover:text-cinema-accent">
										{person.name}
									</div>
									<div class="truncate text-xs text-cinema-text-muted">
										{person.knownForDepartment || 'Film Creator'}
										{#if person.knownForTitles && person.knownForTitles.length > 0}
											· {person.knownForTitles.slice(0, 2).join(', ')}
										{/if}
									</div>
								</div>
							</div>
							<span
								class="rounded border border-cinema-border bg-cinema-surface px-1.5 py-0.5 text-[10px] text-cinema-text-muted group-hover:text-cinema-accent"
							>
								Profile
							</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Category 3: Movies -->
		{#if suggestions.movies && suggestions.movies.length > 0}
			<div class="p-2">
				<div
					class="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold tracking-wider text-cinema-accent"
				>
					<Film class="h-3 w-3" />
					<span>MOVIES</span>
				</div>
				<div class="mt-1 flex flex-col gap-1">
					{#each suggestions.movies as movie, i (movie.id)}
						{@const globalIndex =
							(suggestions.discovery?.length ?? 0) + (suggestions.people?.length ?? 0) + i}
						{@const isSelected = activeIndex === globalIndex}
						<button
							type="button"
							role="option"
							aria-selected={isSelected}
							id={`suggestion-item-${globalIndex}`}
							onmousedown={() => onSelect({ kind: 'movie', item: movie })}
							class="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors {isSelected
								? 'bg-cinema-elevated text-cinema-accent'
								: 'text-cinema-text hover:bg-cinema-elevated/70'}"
						>
							<div class="flex items-center gap-3">
								<div
									class="h-10 w-7 shrink-0 overflow-hidden rounded border border-cinema-border bg-cinema-muted"
								>
									{#if movie.posterUrl}
										<img
											src={movie.posterUrl}
											alt={movie.title}
											class="h-full w-full object-cover"
										/>
									{:else}
										<div
											class="flex h-full w-full items-center justify-center text-cinema-text-muted"
										>
											<Clapperboard class="h-3.5 w-3.5" />
										</div>
									{/if}
								</div>
								<div class="min-w-0">
									<div class="truncate text-sm font-medium group-hover:text-cinema-accent">
										{movie.title}
									</div>
									<div class="flex items-center gap-2 text-xs text-cinema-text-muted">
										{#if movie.releaseYear}
											<span class="flex items-center gap-0.5">
												<Calendar class="h-3 w-3" />
												<span>{movie.releaseYear}</span>
											</span>
										{/if}
										{#if movie.rating}
											<span class="flex items-center gap-0.5 text-cinema-accent">
												<Star class="h-3 w-3 fill-cinema-accent text-cinema-accent" />
												<span>{movie.rating}</span>
											</span>
										{/if}
									</div>
								</div>
							</div>
							<span class="text-xs text-cinema-text-muted group-hover:text-cinema-accent">
								View →
							</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
