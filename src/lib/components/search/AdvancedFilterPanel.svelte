<script lang="ts">
	import type { TMDBGenre } from '#lib/types/tmdb';
	import { SlidersHorizontal, RotateCcw, X, Check } from 'lucide-svelte';

	export interface FilterState {
		genre?: string;
		year?: number | null;
		minRating?: number | null;
		language?: string;
		country?: string;
		company?: string | number;
		sortBy?: string;
	}

	let {
		isOpen,
		filters,
		genres = [],
		onApply,
		onReset,
		onClose
	}: {
		isOpen: boolean;
		filters: FilterState;
		genres: TMDBGenre[];
		onApply: (filters: FilterState) => void;
		onReset: () => void;
		onClose: () => void;
	} = $props();

	let localGenre = $state('');
	let localYear = $state('');
	let localRating = $state('');
	let localLanguage = $state('');
	let localCountry = $state('');
	let localCompany = $state('');
	let localSortBy = $state('popularity.desc');

	// Synchronize when outer filters change
	$effect(() => {
		localGenre = filters.genre || '';
		localYear = filters.year ? String(filters.year) : '';
		localRating = filters.minRating ? String(filters.minRating) : '';
		localLanguage = filters.language || '';
		localCountry = filters.country || '';
		localCompany = filters.company ? String(filters.company) : '';
		localSortBy = filters.sortBy || 'popularity.desc';
	});

	const popularLanguages = [
		{ code: 'en', name: 'English' },
		{ code: 'ja', name: 'Japanese' },
		{ code: 'ko', name: 'Korean' },
		{ code: 'fr', name: 'French' },
		{ code: 'es', name: 'Spanish' },
		{ code: 'de', name: 'German' },
		{ code: 'it', name: 'Italian' },
		{ code: 'zh', name: 'Chinese' },
		{ code: 'hi', name: 'Hindi' }
	];

	const popularCountries = [
		{ code: 'US', name: 'United States' },
		{ code: 'GB', name: 'United Kingdom' },
		{ code: 'JP', name: 'Japan' },
		{ code: 'KR', name: 'South Korea' },
		{ code: 'FR', name: 'France' },
		{ code: 'DE', name: 'Germany' },
		{ code: 'CA', name: 'Canada' },
		{ code: 'IT', name: 'Italy' },
		{ code: 'IN', name: 'India' },
		{ code: 'ES', name: 'Spain' },
		{ code: 'AU', name: 'Australia' }
	];

	const sortOptions = [
		{ value: 'popularity.desc', label: 'Most Popular' },
		{ value: 'vote_average.desc', label: 'Highest Rated' },
		{ value: 'primary_release_date.desc', label: 'Release Date: Newest' },
		{ value: 'primary_release_date.asc', label: 'Release Date: Oldest' }
	];

	function handleFormSubmit(e: SubmitEvent) {
		e.preventDefault();
		const yearNum = parseInt(localYear.trim(), 10);
		const ratingNum = parseFloat(localRating.trim());

		onApply({
			genre: localGenre.trim() || undefined,
			year: !isNaN(yearNum) && yearNum >= 1888 ? yearNum : null,
			minRating: !isNaN(ratingNum) && ratingNum > 0 ? ratingNum : null,
			language: localLanguage.trim() || undefined,
			country: localCountry.trim() || undefined,
			company: localCompany.trim() || undefined,
			sortBy: localSortBy || 'popularity.desc'
		});
	}

	function handleFormReset() {
		localGenre = '';
		localYear = '';
		localRating = '';
		localLanguage = '';
		localCountry = '';
		localCompany = '';
		localSortBy = 'popularity.desc';
		onReset();
	}
</script>

{#if isOpen}
	<div
		class="relative mt-4 overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface p-5 shadow-lg transition-all duration-200"
		aria-label="Discovery Filters Panel"
	>
		<div class="flex items-center justify-between border-b border-cinema-border/50 pb-3">
			<div class="flex items-center gap-2">
				<SlidersHorizontal class="h-4 w-4 text-cinema-accent" />
				<h3 class="font-['Space_Grotesk'] text-sm font-bold text-cinema-text">
					Advanced Discovery Filters
				</h3>
			</div>
			<button
				type="button"
				onclick={onClose}
				class="rounded-lg p-1 text-cinema-text-muted transition-colors hover:bg-cinema-elevated hover:text-cinema-text focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
				aria-label="Close filters panel"
			>
				<X class="h-4 w-4" />
			</button>
		</div>

		<form
			onsubmit={handleFormSubmit}
			class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
		>
			<!-- Genre Filter -->
			<div>
				<label for="filter-genre" class="block text-xs font-medium text-cinema-text-muted">
					Genre
				</label>
				<select
					id="filter-genre"
					bind:value={localGenre}
					class="mt-1.5 w-full rounded-xl border border-cinema-border bg-cinema-elevated px-3 py-2 text-xs text-cinema-text transition-colors focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent focus:outline-none"
				>
					<option value="">All Genres</option>
					{#each genres as g (g.id)}
						<option value={String(g.id)}>{g.name}</option>
					{/each}
				</select>
			</div>

			<!-- Release Year Filter -->
			<div>
				<label for="filter-year" class="block text-xs font-medium text-cinema-text-muted">
					Release Year
				</label>
				<input
					id="filter-year"
					type="number"
					min="1888"
					max={new Date().getFullYear() + 5}
					placeholder="e.g. 2024"
					bind:value={localYear}
					class="mt-1.5 w-full rounded-xl border border-cinema-border bg-cinema-elevated px-3 py-2 text-xs text-cinema-text placeholder-cinema-text-muted transition-colors focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent focus:outline-none"
				/>
			</div>

			<!-- Minimum Rating Filter -->
			<div>
				<label for="filter-rating" class="block text-xs font-medium text-cinema-text-muted">
					Minimum Rating
				</label>
				<select
					id="filter-rating"
					bind:value={localRating}
					class="mt-1.5 w-full rounded-xl border border-cinema-border bg-cinema-elevated px-3 py-2 text-xs text-cinema-text transition-colors focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent focus:outline-none"
				>
					<option value="">Any Rating</option>
					<option value="8.0">8.0+ Exceptional</option>
					<option value="7.0">7.0+ Recommended</option>
					<option value="6.0">6.0+ Good</option>
					<option value="5.0">5.0+ Average</option>
				</select>
			</div>

			<!-- Original Language Filter -->
			<div>
				<label for="filter-language" class="block text-xs font-medium text-cinema-text-muted">
					Original Language
				</label>
				<select
					id="filter-language"
					bind:value={localLanguage}
					class="mt-1.5 w-full rounded-xl border border-cinema-border bg-cinema-elevated px-3 py-2 text-xs text-cinema-text transition-colors focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent focus:outline-none"
				>
					<option value="">Any Language</option>
					{#each popularLanguages as l (l.code)}
						<option value={l.code}>{l.name}</option>
					{/each}
				</select>
			</div>

			<!-- Production Country Filter -->
			<div>
				<label for="filter-country" class="block text-xs font-medium text-cinema-text-muted">
					Production Country
				</label>
				<select
					id="filter-country"
					bind:value={localCountry}
					class="mt-1.5 w-full rounded-xl border border-cinema-border bg-cinema-elevated px-3 py-2 text-xs text-cinema-text transition-colors focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent focus:outline-none"
				>
					<option value="">Any Country</option>
					{#each popularCountries as c (c.code)}
						<option value={c.code}>{c.name}</option>
					{/each}
				</select>
			</div>

			<!-- Production Company Filter -->
			<div>
				<label for="filter-company" class="block text-xs font-medium text-cinema-text-muted">
					Production Company (ID)
				</label>
				<input
					id="filter-company"
					type="text"
					placeholder="e.g. 174 (Warner Bros.)"
					bind:value={localCompany}
					class="mt-1.5 w-full rounded-xl border border-cinema-border bg-cinema-elevated px-3 py-2 text-xs text-cinema-text placeholder-cinema-text-muted transition-colors focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent focus:outline-none"
				/>
			</div>

			<!-- Sort By Filter -->
			<div>
				<label for="filter-sort" class="block text-xs font-medium text-cinema-text-muted">
					Sort Order
				</label>
				<select
					id="filter-sort"
					bind:value={localSortBy}
					class="mt-1.5 w-full rounded-xl border border-cinema-border bg-cinema-elevated px-3 py-2 text-xs text-cinema-text transition-colors focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent focus:outline-none"
				>
					{#each sortOptions as s (s.value)}
						<option value={s.value}>{s.label}</option>
					{/each}
				</select>
			</div>

			<!-- Actions -->
			<div
				class="col-span-full mt-2 flex items-center justify-end gap-2 border-t border-cinema-border/50 pt-3"
			>
				<button
					type="button"
					onclick={handleFormReset}
					class="flex items-center gap-1.5 rounded-xl border border-cinema-border px-3 py-2 text-xs font-medium text-cinema-text-muted transition-colors hover:bg-cinema-elevated hover:text-cinema-text focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
				>
					<RotateCcw class="h-3.5 w-3.5" />
					<span>Reset</span>
				</button>
				<button
					type="submit"
					class="flex items-center gap-1.5 rounded-xl bg-cinema-accent px-4 py-2 text-xs font-bold text-cinema-accent-foreground transition-transform hover:scale-[1.02] hover:bg-cinema-accent-hover focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none active:scale-[0.98]"
				>
					<Check class="h-3.5 w-3.5" />
					<span>Apply Filters</span>
				</button>
			</div>
		</form>
	</div>
{/if}
