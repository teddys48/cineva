<script lang="ts">
	import './layout.css';
	import type { LayoutProps } from './$types';
	import Navbar from '#lib/components/layout/Navbar.svelte';
	import Footer from '#lib/components/layout/Footer.svelte';
	import Toast from '#lib/components/ui/Toast.svelte';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<!-- Accessible Skip to Main Content Link for Keyboard and Screen Reader Users -->
<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-cinema-accent focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-cinema-accent-foreground focus:shadow-lg focus:ring-2 focus:ring-cinema-accent focus:outline-none"
>
	Skip to main content
</a>

<div
	class="flex min-h-[100dvh] flex-col bg-cinema-bg text-cinema-text transition-colors duration-200"
>
	<Navbar />
	<main id="main-content" tabindex="-1" class="flex-1 focus:outline-none">
		{@render children()}
	</main>
	<Footer />
	<Toast />
</div>
