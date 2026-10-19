<script lang="ts">
	import type { Genre } from '#lib/types/movie';
	import { Sparkles, Flame, Heart, Zap, Theater, Palette, Film } from 'lucide-svelte';

	interface Props {
		genre: Genre;
	}

	let { genre }: Props = $props();

	type IconType = typeof Film;

	// Select contextual icon for genre
	const iconMap: Record<string, IconType> = {
		'sci-fi': Sparkles,
		drama: Theater,
		thriller: Zap,
		action: Flame,
		animation: Palette,
		romance: Heart
	};

	let IconComponent = $derived(iconMap[genre.slug] || Film);
</script>

<a
	href="/explore?genre={genre.slug}"
	class="group relative flex h-full flex-col items-center justify-start overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface/70 p-5 text-center shadow-xs backdrop-blur-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-cinema-accent/40 hover:bg-cinema-surface hover:shadow-lg hover:shadow-cinema-accent/5 focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none active:scale-[0.98] sm:p-6"
>
	<!-- Subtle ambient glow on hover -->
	<div
		class="pointer-events-none absolute inset-0 bg-gradient-to-b from-cinema-accent/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
		aria-hidden="true"
	></div>

	<!-- Centered Icon Container with micro-interaction -->
	<div
		class="relative flex h-13 w-13 items-center justify-center rounded-2xl border border-cinema-border bg-cinema-elevated text-cinema-accent shadow-inner transition-all duration-300 ease-out group-hover:scale-110 group-hover:border-cinema-accent/60 group-hover:bg-cinema-accent group-hover:text-cinema-accent-foreground group-hover:shadow-md group-hover:shadow-cinema-accent/20 sm:h-14 sm:w-14"
	>
		{#if IconComponent}
			{@const Icon = IconComponent}
			<Icon
				class="h-6 w-6 transition-transform duration-300 group-hover:scale-105"
				aria-hidden="true"
			/>
		{/if}
	</div>

	<!-- Genre Title & Description -->
	<div class="relative mt-4 flex flex-1 flex-col items-center">
		<h3
			class="font-['Space_Grotesk'] text-base font-bold tracking-tight text-cinema-text transition-colors duration-200 group-hover:text-cinema-accent sm:text-lg"
		>
			{genre.name}
		</h3>
		<p
			class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-cinema-text-muted transition-colors duration-200 group-hover:text-cinema-text/80"
		>
			{genre.description}
		</p>
	</div>
</a>
