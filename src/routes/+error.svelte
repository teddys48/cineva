<script lang="ts">
	import { page } from '$app/state';
	import { Film, Home, Compass, RotateCcw } from 'lucide-svelte';

	let status = $derived(page.status);
	let message = $derived(
		page.error?.message ||
			(status === 404
				? 'The film or page you are looking for could not be found.'
				: 'An unexpected cinematic error occurred. Please try again.')
	);

	function handleReload() {
		if (typeof window !== 'undefined') {
			window.location.reload();
		}
	}
</script>

<svelte:head>
	<title>{status} — Scenora</title>
</svelte:head>

<div class="flex min-h-[65vh] flex-col items-center justify-center px-4 py-16 text-center">
	<div class="mx-auto max-w-md">
		<div
			class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-cinema-border bg-cinema-surface text-cinema-accent shadow-sm"
		>
			<Film class="h-8 w-8" />
		</div>

		<span class="font-mono text-xs font-bold tracking-wider text-cinema-accent uppercase">
			Error {status}
		</span>

		<h1
			class="mt-2 font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-cinema-text sm:text-4xl"
		>
			{status === 404 ? 'Scene Not Found' : 'Playback Interrupted'}
		</h1>

		<p class="mt-3 text-sm leading-relaxed text-cinema-text-muted sm:text-base">
			{message}
		</p>

		<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
			<a
				href="/"
				class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cinema-accent px-5 text-sm font-semibold text-cinema-accent-foreground shadow-sm transition-all hover:bg-cinema-accent-hover focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
			>
				<Home class="h-4 w-4" />
				<span>Return Home</span>
			</a>

			<a
				href="/explore"
				class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-5 text-sm font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
			>
				<Compass class="h-4 w-4 text-cinema-text-muted" />
				<span>Explore Films</span>
			</a>

			<button
				type="button"
				onclick={handleReload}
				class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-4 text-sm font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
				title="Try reloading this page"
			>
				<RotateCcw class="h-4 w-4 text-cinema-text-muted" />
				<span>Retry</span>
			</button>
		</div>
	</div>
</div>
