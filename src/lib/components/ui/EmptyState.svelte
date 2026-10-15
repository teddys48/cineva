<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Film } from 'lucide-svelte';

	type IconType = typeof Film;

	interface Props {
		title: string;
		description: string;
		actionHref?: string;
		actionLabel?: string;
		icon?: IconType;
		children?: Snippet;
	}

	let {
		title,
		description,
		actionHref,
		actionLabel,
		icon: Icon = Film,
		children
	}: Props = $props();
</script>

<div
	class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cinema-border bg-cinema-surface/60 p-8 text-center shadow-xs sm:p-12"
>
	<div
		class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-cinema-border bg-cinema-elevated text-cinema-accent shadow-xs"
	>
		<Icon class="h-6 w-6" />
	</div>
	<h3 class="font-['Space_Grotesk'] text-lg font-semibold text-cinema-text">
		{title}
	</h3>
	<p class="mt-2 max-w-sm text-sm leading-relaxed text-cinema-text-muted">
		{description}
	</p>
	{#if actionHref && actionLabel}
		<a
			href={actionHref}
			class="mt-6 inline-flex items-center gap-2 rounded-lg bg-cinema-accent px-4 py-2 text-sm font-semibold text-cinema-accent-foreground shadow-xs transition-colors hover:bg-cinema-accent-hover focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
		>
			{actionLabel}
		</a>
	{/if}
	{#if children}
		<div class="mt-4">
			{@render children()}
		</div>
	{/if}
</div>
