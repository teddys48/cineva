<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	interface Props {
		currentPage: number;
		totalPages: number;
		getPageUrl: (page: number) => string;
		onPageSelect?: (page: number) => void;
		class?: string;
	}

	let {
		currentPage,
		totalPages,
		getPageUrl,
		onPageSelect,
		class: className = ''
	}: Props = $props();

	// TMDB caps paginated results at 500 pages
	const effectiveTotalPages = $derived(Math.min(500, Math.max(1, totalPages)));
	const hasPrevious = $derived(currentPage > 1);
	const hasNext = $derived(currentPage < effectiveTotalPages);

	// Generate smart window of page numbers with ellipses
	const visiblePages = $derived.by(() => {
		const total = effectiveTotalPages;
		const current = currentPage;

		if (total <= 7) {
			return Array.from({ length: total }, (_, i) => i + 1);
		}

		if (current <= 4) {
			return [1, 2, 3, 4, 5, '...', total];
		}

		if (current >= total - 3) {
			return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
		}

		return [1, '...', current - 1, current, current + 1, '...', total];
	});

	function handleClick(e: MouseEvent, targetPage: number) {
		if (onPageSelect) {
			e.preventDefault();
			onPageSelect(targetPage);
		}
	}
</script>

{#if effectiveTotalPages > 1}
	<nav
		class="flex flex-col items-center justify-between gap-4 py-8 sm:flex-row {className}"
		aria-label="Pagination Navigation"
	>
		<!-- Mobile Page Indicator -->
		<div class="text-xs text-cinema-text-muted sm:hidden">
			Page <span class="font-semibold text-cinema-text">{currentPage}</span> of
			<span class="font-semibold text-cinema-text">{effectiveTotalPages}</span>
		</div>

		<!-- Pagination Buttons -->
		<div class="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
			<!-- Previous Page Button -->
			{#if hasPrevious}
				<a
					href={getPageUrl(currentPage - 1)}
					onclick={(e) => handleClick(e, currentPage - 1)}
					class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-cinema-border bg-cinema-surface px-3 text-xs font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
					aria-label="Go to previous page"
				>
					<ChevronLeft class="h-4 w-4" />
					<span class="hidden sm:inline">Previous</span>
				</a>
			{:else}
				<span
					class="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg border border-cinema-border/50 bg-cinema-surface/40 px-3 text-xs font-medium text-cinema-text-muted/40"
					aria-disabled="true"
				>
					<ChevronLeft class="h-4 w-4" />
					<span class="hidden sm:inline">Previous</span>
				</span>
			{/if}

			<!-- Numbered Page Links (hidden on mobile, visible on sm+) -->
			<div class="hidden items-center gap-1.5 sm:flex">
				{#each visiblePages as p, index (typeof p === 'number' ? `page-${p}` : `ellipsis-${index}`)}
					{#if typeof p === 'number'}
						{@const isCurrent = p === currentPage}
						{#if isCurrent}
							<span
								class="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-cinema-accent px-3 text-xs font-bold text-cinema-accent-foreground shadow-xs"
								aria-current="page"
							>
								{p}
							</span>
						{:else}
							<a
								href={getPageUrl(p)}
								onclick={(e) => handleClick(e, p)}
								class="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface px-3 text-xs font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
								aria-label="Go to page {p}"
							>
								{p}
							</a>
						{/if}
					{:else}
						<span
							class="inline-flex h-9 min-w-7 items-center justify-center px-1 text-xs font-semibold text-cinema-text-muted select-none"
							aria-hidden="true"
						>
							&hellip;
						</span>
					{/if}
				{/each}
			</div>

			<!-- Next Page Button -->
			{#if hasNext}
				<a
					href={getPageUrl(currentPage + 1)}
					onclick={(e) => handleClick(e, currentPage + 1)}
					class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-cinema-border bg-cinema-surface px-3 text-xs font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
					aria-label="Go to next page"
				>
					<span class="hidden sm:inline">Next</span>
					<ChevronRight class="h-4 w-4" />
				</a>
			{:else}
				<span
					class="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg border border-cinema-border/50 bg-cinema-surface/40 px-3 text-xs font-medium text-cinema-text-muted/40"
					aria-disabled="true"
				>
					<span class="hidden sm:inline">Next</span>
					<ChevronRight class="h-4 w-4" />
				</span>
			{/if}
		</div>

		<!-- Page Bounds / Total Count Counter -->
		<div class="hidden text-xs text-cinema-text-muted sm:block">
			Page <span class="font-medium text-cinema-text">{currentPage}</span> of
			<span class="font-medium text-cinema-text">{effectiveTotalPages}</span>
		</div>
	</nav>
{/if}
