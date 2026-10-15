<script lang="ts">
	import { themeState } from '#lib/theme.svelte';
	import { Sun, Moon } from 'lucide-svelte';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<button
	type="button"
	onclick={() => themeState.toggle()}
	class="group relative flex h-10 w-10 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface text-cinema-text transition-colors hover:border-cinema-accent/50 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none {className}"
	aria-label={themeState.current === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
	title={themeState.current === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
>
	{#if themeState.current === 'dark'}
		<Sun
			class="h-4 w-4 text-cinema-accent transition-transform duration-200 group-hover:rotate-45"
		/>
	{:else}
		<Moon
			class="h-4 w-4 text-cinema-accent transition-transform duration-200 group-hover:-rotate-12"
		/>
	{/if}
</button>
