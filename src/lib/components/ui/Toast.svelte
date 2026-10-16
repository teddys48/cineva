<script lang="ts">
	import { watchlistState } from '#lib/watchlist.svelte';
	import { Bookmark, Check, AlertCircle, X } from 'lucide-svelte';

	let toast = $derived(watchlistState.toast);
</script>

{#if toast}
	<aside
		class="animate-in fade-in slide-in-from-bottom-2 fixed bottom-6 left-1/2 z-50 flex max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border border-cinema-border bg-cinema-elevated/95 px-4 py-3 text-sm text-cinema-text shadow-xl backdrop-blur-md transition-all duration-200 sm:bottom-8"
		role="status"
		aria-live="polite"
	>
		<div class="flex-shrink-0">
			{#if toast.type === 'success'}
				<div
					class="flex h-7 w-7 items-center justify-center rounded-lg bg-cinema-accent/15 text-cinema-accent"
				>
					<Check class="h-4 w-4" />
				</div>
			{:else if toast.type === 'error'}
				<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
					<AlertCircle class="h-4 w-4" />
				</div>
			{:else}
				<div
					class="flex h-7 w-7 items-center justify-center rounded-lg bg-cinema-surface text-cinema-text-muted"
				>
					<Bookmark class="h-4 w-4" />
				</div>
			{/if}
		</div>

		<div class="flex-1 text-xs font-medium sm:text-sm">
			<span>{toast.message}</span>
		</div>

		<button
			type="button"
			onclick={() => watchlistState.dismissToast()}
			class="flex h-6 w-6 items-center justify-center rounded text-cinema-text-muted transition-colors hover:text-cinema-text focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
			aria-label="Dismiss notification"
		>
			<X class="h-3.5 w-3.5" />
		</button>
	</aside>
{/if}
