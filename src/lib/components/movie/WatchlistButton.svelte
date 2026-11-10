<script lang="ts">
	import type { Movie, MovieDetail } from '#lib/types/movie';
	import type { TVShow, TVDetail } from '#lib/types/tv';
	import type { PersonCreditTV } from '#lib/types/person';
	import { watchlistState } from '#lib/watchlist.svelte';
	import { Bookmark, Check } from 'lucide-svelte';

	interface Props {
		item?: Movie | MovieDetail | TVShow | TVDetail | PersonCreditTV;
		movie?: Movie | MovieDetail | TVShow | TVDetail | PersonCreditTV; // backward compat
		variant?: 'icon' | 'button';
		class?: string;
	}

	let { item, movie, variant = 'icon', class: className = '' }: Props = $props();

	const target = $derived(item || movie!);
	const mediaType = $derived(
		(target && 'mediaType' in target && target.mediaType) ? target.mediaType : 'movie'
	);
	const targetTitle = $derived(
		target ? ('name' in target && target.name ? target.name : target.title) : ''
	);

	let isSaved = $derived(target ? watchlistState.has(target.id, mediaType) : false);

	const ariaLabel = $derived(
		isSaved ? `Remove ${targetTitle} from Watchlist` : `Add ${targetTitle} to Watchlist`
	);

	function handleClick(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (!target) return;
		watchlistState.toggle(target, mediaType);
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
		class="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none active:scale-[0.98] {isSaved
			? 'border-cinema-accent/50 bg-cinema-accent/15 text-cinema-accent hover:border-cinema-accent hover:bg-cinema-accent/25'
			: 'border-cinema-border bg-cinema-surface text-cinema-text shadow-sm hover:border-cinema-accent/50 hover:bg-cinema-elevated'} {className}"
		aria-label={ariaLabel}
		aria-pressed={isSaved}
	>
		{#if isSaved}
			<Check class="h-4 w-4 text-cinema-accent" />
			<span>In Watchlist</span>
		{:else}
			<Bookmark class="h-4 w-4" />
			<span>Add to Watchlist</span>
		{/if}
	</button>
{/if}
