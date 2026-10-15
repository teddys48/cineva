<script lang="ts">
	import { AlertCircle, RefreshCw } from 'lucide-svelte';

	interface Props {
		title?: string;
		message?: string;
		onretry?: () => void;
	}

	let {
		title = 'Unable to Load Collection',
		message = 'A temporary connection issue prevented loading this section. Please try again.',
		onretry
	}: Props = $props();

	function handleRetry() {
		if (onretry) {
			onretry();
		} else if (typeof window !== 'undefined') {
			window.location.reload();
		}
	}
</script>

<div
	class="flex flex-col items-center justify-center rounded-2xl border border-cinema-border/70 bg-cinema-surface/50 p-6 text-center sm:p-8"
	role="alert"
>
	<div
		class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-cinema-border bg-cinema-elevated text-cinema-text-muted"
	>
		<AlertCircle class="h-5 w-5 text-amber-400" />
	</div>
	<h3 class="font-['Space_Grotesk'] text-base font-semibold text-cinema-text">
		{title}
	</h3>
	<p class="mt-1.5 max-w-md text-xs leading-relaxed text-cinema-text-muted sm:text-sm">
		{message}
	</p>
	<button
		type="button"
		onclick={handleRetry}
		class="mt-4 inline-flex items-center gap-2 rounded-lg border border-cinema-border bg-cinema-surface px-4 py-2 text-xs font-semibold text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
	>
		<RefreshCw class="h-3.5 w-3.5 text-cinema-accent" />
		<span>Retry</span>
	</button>
</div>
