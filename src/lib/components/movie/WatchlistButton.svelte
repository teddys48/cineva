<script lang="ts">
	import type { Movie, MovieDetail } from '#lib/types/movie';
	import { watchlistState } from '#lib/watchlist.svelte';
	import { Bookmark, Check } from 'lucide-svelte';

	interface Props {
		movie: Movie | MovieDetail;
		variant?: 'icon' | 'button';
		class?: string;
	}

	let { movie, variant = 'icon', class: className = '' }: Props = $props();

	let isSaved = $derived(watchlistState.has(movie.id));

	const ariaLabel = $derived(
		isSaved ? `Remove ${movie.title} from Watchlist` : `Add ${movie.title} to Watchlist`
	);

	function handleClick(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		watchlistState.toggle(movie);
	}
</script>

{#if variant === 'icon'}
	<button
		type="button"
		onclick={handleClick}
		class="group/btn relative flex h-8 w-8 items-center justify-center rounded-lg border border-cinema-border/60 bg-cinema-bg/85 text-cinema-text shadow-sm backdrop-blur-md transition-all duration-200 hover:border-cinema-accent/60 hover:bg-cinema-surface hover:text-cinema-accent focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none active:scale-95 {isSaved
			? 'border-cinema-accent/50 text-cinema-accent'
			: 'text-cinema-text-muted'} {className}"
		aria-label={ariaLabel}
		aria-pressed={isSaved}
		title={isSaved ? 'In your Watchlist' : 'Add to Watchlist'}
	>
		{#if isSaved}
			<Bookmark
				class="h-4 w-4 fill-cinema-accent text-cinema-accent transition-transform duration-200 group-hover/btn:scale-110"
			/>
		{:else}
			<Bookmark
				class="h-4 w-4 transition-transform duration-200 group-hover/btn:scale-110 group-hover/btn:text-cinema-accent"
			/>
		{/if}
	</button>
{:else}
	<button
		type="button"
		onclick={handleClick}
		class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-5 text-sm font-medium text-cinema-text shadow-xs transition-all duration-200 hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none active:scale-[0.98] {isSaved
			? 'border-cinema-accent/40 bg-cinema-elevated text-cinema-accent'
			: ''} {className}"
		aria-label={ariaLabel}
		aria-pressed={isSaved}
	>
		{#if isSaved}
			<Check class="h-4 w-4 text-cinema-accent" />
			<span class="font-semibold text-cinema-accent">In Watchlist</span>
		{:else}
			<Bookmark
				class="h-4 w-4 text-cinema-text-muted transition-colors group-hover:text-cinema-accent"
			/>
			<span>Add to Watchlist</span>
		{/if}
	</button>
{/if}
