<script lang="ts">
	import type { Genre } from '#lib/types/movie';
	import { Compass, Sparkles, Flame, Heart, Zap, Tv } from 'lucide-svelte';

	interface Props {
		genre: Genre;
	}

	let { genre }: Props = $props();

	type IconType = typeof Compass;

	// Select contextual icon for genre
	const iconMap: Record<string, IconType> = {
		'sci-fi': Sparkles,
		drama: Tv,
		thriller: Zap,
		action: Flame,
		animation: Compass,
		romance: Heart
	};

	let IconComponent = $derived(iconMap[genre.slug] || Compass);
</script>

<a
	href="/explore?genre={genre.slug}"
	class="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-cinema-border bg-cinema-surface p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-cinema-accent/50 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
>
	<div class="flex items-center justify-between">
		<div
			class="flex h-10 w-10 items-center justify-center rounded-lg border border-cinema-border bg-cinema-elevated text-cinema-accent transition-colors group-hover:bg-cinema-accent group-hover:text-cinema-accent-foreground"
		>
			{#if IconComponent}
				{@const Icon = IconComponent}
				<Icon class="h-5 w-5" />
			{/if}
		</div>
		<span
			class="rounded-full border border-cinema-border/50 bg-cinema-bg px-2.5 py-0.5 font-mono text-xs text-cinema-text-muted"
		>
			{genre.movieCount} titles
		</span>
	</div>

	<div class="mt-4">
		<h3
			class="font-['Space_Grotesk'] text-base font-bold text-cinema-text transition-colors group-hover:text-cinema-accent"
		>
			{genre.name}
		</h3>
		<p class="mt-1 line-clamp-2 text-xs leading-relaxed text-cinema-text-muted">
			{genre.description}
		</p>
	</div>
</a>
