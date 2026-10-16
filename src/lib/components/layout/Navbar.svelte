<script lang="ts">
	import { page } from '$app/state';
	import { Film, Compass, Bookmark, Search, Menu, X } from 'lucide-svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { watchlistState } from '#lib/watchlist.svelte';

	let isMobileMenuOpen = $state(false);

	const navItems = [
		{ href: '/', label: 'Home', icon: Film },
		{ href: '/explore', label: 'Explore', icon: Compass },
		{ href: '/watchlist', label: 'Watchlist', icon: Bookmark }
	];

	function closeMenu() {
		isMobileMenuOpen = false;
	}
</script>

<header
	class="sticky top-0 z-40 w-full border-b border-cinema-border bg-cinema-bg/90 backdrop-blur-md transition-colors duration-200"
>
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<!-- Brand Logo -->
		<a
			href="/"
			class="group flex items-center gap-2.5 rounded-lg py-1 focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
			aria-label="Cineva Home"
		>
			<div
				class="flex h-9 w-9 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface text-cinema-accent transition-transform duration-200 group-hover:scale-105 group-hover:border-cinema-accent/40"
			>
				<Film class="h-5 w-5" />
			</div>
			<div class="flex flex-col">
				<span
					class="font-['Space_Grotesk'] text-xl font-bold tracking-tight text-cinema-text transition-colors group-hover:text-cinema-accent"
				>
					Cineva
				</span>
			</div>
		</a>

		<!-- Desktop Navigation -->
		<nav class="hidden items-center gap-1 md:flex" aria-label="Main Navigation">
			{#each navItems as item (item.href)}
				{@const isActive =
					item.href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(item.href)}
				{@const Icon = item.icon}
				<a
					href={item.href}
					class="relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none {isActive
						? 'bg-cinema-surface font-semibold text-cinema-text'
						: 'text-cinema-text-muted hover:bg-cinema-surface/60 hover:text-cinema-text'}"
				>
					<Icon class="h-4 w-4 {isActive ? 'text-cinema-accent' : 'text-cinema-text-muted'}" />
					<span>{item.label}</span>
					{#if item.href === '/watchlist' && watchlistState.count > 0}
						<span
							class="flex h-4 min-w-4 items-center justify-center rounded-full bg-cinema-accent px-1 font-mono text-[10px] font-bold text-cinema-accent-foreground"
						>
							{watchlistState.count}
						</span>
					{/if}
					{#if isActive}
						<span class="absolute right-3 bottom-0 left-3 h-0.5 rounded-full bg-cinema-accent"
						></span>
					{/if}
				</a>
			{/each}
		</nav>

		<!-- Actions -->
		<div class="flex items-center gap-2">
			<!-- Search Trigger -->
			<a
				href="/search"
				class="flex h-10 items-center gap-2 rounded-lg border border-cinema-border bg-cinema-surface px-3.5 text-sm text-cinema-text-muted transition-colors hover:border-cinema-accent/40 hover:text-cinema-text focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
				aria-label="Search movies"
			>
				<Search class="h-4 w-4 text-cinema-accent" />
				<span class="hidden sm:inline">Search cinema...</span>
				<kbd
					class="hidden rounded bg-cinema-elevated px-1.5 py-0.5 font-mono text-[10px] text-cinema-text-muted lg:inline-block"
					>/search</kbd
				>
			</a>

			<!-- Accessible Theme Toggle -->
			<ThemeToggle />

			<!-- Mobile Menu Toggle -->
			<button
				type="button"
				class="flex h-10 w-10 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface text-cinema-text focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none md:hidden"
				onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
				aria-expanded={isMobileMenuOpen}
				aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
			>
				{#if isMobileMenuOpen}
					<X class="h-5 w-5" />
				{:else}
					<Menu class="h-5 w-5" />
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile Dropdown Navigation -->
	{#if isMobileMenuOpen}
		<div class="border-b border-cinema-border bg-cinema-bg px-4 py-3 md:hidden">
			<nav class="flex flex-col gap-1" aria-label="Mobile Navigation">
				{#each navItems as item (item.href)}
					{@const isActive =
						item.href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(item.href)}
					{@const Icon = item.icon}
					<a
						href={item.href}
						onclick={closeMenu}
						class="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium transition-colors {isActive
							? 'bg-cinema-surface text-cinema-accent'
							: 'text-cinema-text-muted hover:bg-cinema-surface hover:text-cinema-text'}"
					>
						<div class="flex items-center gap-3">
							<Icon class="h-5 w-5" />
							<span>{item.label}</span>
						</div>
						{#if item.href === '/watchlist' && watchlistState.count > 0}
							<span
								class="flex h-5 min-w-5 items-center justify-center rounded-full bg-cinema-accent px-1.5 font-mono text-xs font-bold text-cinema-accent-foreground"
							>
								{watchlistState.count}
							</span>
						{/if}
					</a>
				{/each}
			</nav>
		</div>
	{/if}
</header>
