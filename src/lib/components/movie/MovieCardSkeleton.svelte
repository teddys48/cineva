<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<div class="flex flex-col {className}" aria-hidden="true">
	<!-- 2:3 Aspect Ratio Card Skeleton -->
	<div
		class="relative aspect-[2/3] w-full animate-pulse overflow-hidden rounded-xl border border-cinema-border/50 bg-cinema-surface/80"
	>
		<!-- Subtle shimmering gradient highlight -->
		<div
			class="absolute inset-0 bg-gradient-to-t from-cinema-elevated/40 via-transparent to-transparent"
		></div>
	</div>

	<!-- Title & Metadata Skeletons matching card layout -->
	<div class="mt-2.5 flex flex-col gap-1.5">
		<div class="h-4 w-3/4 animate-pulse rounded bg-cinema-surface"></div>
		<div class="h-3 w-1/3 animate-pulse rounded bg-cinema-elevated"></div>
	</div>
</div>
