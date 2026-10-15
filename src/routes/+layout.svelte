<script lang="ts">
	import './layout.css';
	import type { LayoutProps } from './$types';
	import Navbar from '#lib/components/layout/Navbar.svelte';
	import Footer from '#lib/components/layout/Footer.svelte';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div
	class="flex min-h-[100dvh] flex-col bg-cinema-bg text-cinema-text transition-colors duration-200"
>
	<Navbar />
	<main class="flex-1">
		{@render children()}
	</main>
	<Footer />
</div>
