<script lang="ts">
	import type { SearchCompany } from '#lib/types/search';
	import { Building2, Globe } from 'lucide-svelte';

	let { company }: { company: SearchCompany } = $props();

	let logoError = $state(false);
</script>

<a
	href={`/company/${company.id}`}
	class="group relative flex items-center gap-3.5 rounded-xl border border-cinema-border bg-cinema-surface p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-cinema-accent/40 hover:bg-cinema-elevated hover:shadow-md focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
	aria-label={`View production catalog for ${company.name}`}
>
	<!-- Company Logo Thumbnail -->
	<div
		class="relative flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cinema-border/70 bg-white/5 p-1.5"
	>
		{#if company.logoUrl && !logoError}
			<img
				src={company.logoUrl}
				alt={company.name}
				loading="lazy"
				onerror={() => (logoError = true)}
				class="max-h-full max-w-full object-contain drop-shadow-sm filter transition-transform duration-200 group-hover:scale-105"
			/>
		{:else}
			<Building2 class="h-5 w-5 text-cinema-text-muted" />
		{/if}
	</div>

	<!-- Info Details -->
	<div class="min-w-0 flex-1">
		<h4
			class="truncate font-['Space_Grotesk'] text-sm font-semibold text-cinema-text transition-colors group-hover:text-cinema-accent"
		>
			{company.name}
		</h4>
		<div class="mt-0.5 flex items-center gap-1.5 text-xs text-cinema-text-muted">
			{#if company.originCountry}
				<span class="flex items-center gap-1">
					<Globe class="h-3 w-3 text-cinema-accent/70" />
					<span>{company.originCountry}</span>
				</span>
			{/if}
			<span>·</span>
			<span class="text-cinema-accent/80 group-hover:underline">View film catalog</span>
		</div>
	</div>
</a>
