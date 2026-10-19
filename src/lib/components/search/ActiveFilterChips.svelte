<script lang="ts">
	import type { ActiveFilterItem } from '#lib/types/search';
	import { X, Filter, RotateCcw } from 'lucide-svelte';

	let {
		items,
		onRemove,
		onClear
	}: {
		items: ActiveFilterItem[];
		onRemove: (key: string) => void;
		onClear: () => void;
	} = $props();
</script>

{#if items.length > 0}
	<div
		class="flex flex-wrap items-center gap-2 rounded-xl border border-cinema-border/70 bg-cinema-surface/50 p-3"
		aria-label="Active Search Filters"
	>
		<div class="flex items-center gap-1.5 text-xs font-semibold text-cinema-accent">
			<Filter class="h-3.5 w-3.5" />
			<span>Active Filters:</span>
		</div>

		{#each items as item (item.key)}
			<span
				class="inline-flex items-center gap-1.5 rounded-lg border border-cinema-border bg-cinema-elevated py-1 pr-1.5 pl-2.5 text-xs text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40"
			>
				<span class="text-cinema-text-muted">{item.label}:</span>
				<span class="font-medium text-cinema-accent">{item.displayValue}</span>
				<button
					type="button"
					onclick={() => onRemove(item.key)}
					class="flex h-4 w-4 items-center justify-center rounded text-cinema-text-muted transition-colors hover:bg-cinema-surface hover:text-cinema-text focus-visible:ring-1 focus-visible:ring-cinema-accent focus-visible:outline-none"
					aria-label={`Remove filter ${item.label} ${item.displayValue}`}
					title={`Remove ${item.label}`}
				>
					<X class="h-3 w-3" />
				</button>
			</span>
		{/each}

		<button
			type="button"
			onclick={onClear}
			class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-cinema-text-muted transition-colors hover:bg-cinema-elevated hover:text-red-400 focus-visible:ring-1 focus-visible:ring-cinema-accent focus-visible:outline-none"
			title="Clear all active discovery filters"
		>
			<RotateCcw class="h-3 w-3" />
			<span>Clear all</span>
		</button>
	</div>
{/if}
