<script lang="ts">
	import type { SearchPerson } from '#lib/types/search';
	import { User, Clapperboard } from 'lucide-svelte';

	let { person }: { person: SearchPerson } = $props();

	let imgError = $state(false);
</script>

<a
	href={`/person/${person.id}`}
	class="group relative flex items-center gap-3.5 rounded-xl border border-cinema-border bg-cinema-surface p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-cinema-accent/40 hover:bg-cinema-elevated hover:shadow-md focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
	aria-label={`View profile and filmography of ${person.name}`}
>
	<!-- Profile Avatar Thumbnail -->
	<div
		class="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-cinema-border/70 bg-cinema-muted"
	>
		{#if person.profileUrl && !imgError}
			<img
				src={person.profileUrl}
				alt={person.name}
				loading="lazy"
				onerror={() => (imgError = true)}
				class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
			/>
		{:else}
			<div class="flex h-full w-full items-center justify-center text-cinema-text-muted">
				<User class="h-6 w-6" />
			</div>
		{/if}
	</div>

	<!-- Info Details -->
	<div class="min-w-0 flex-1">
		<div class="flex items-center gap-2">
			<h3
				class="truncate font-['Space_Grotesk'] text-sm font-bold text-cinema-text transition-colors group-hover:text-cinema-accent"
			>
				{person.name}
			</h3>
			{#if person.knownForDepartment}
				<span
					class="shrink-0 rounded bg-cinema-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-cinema-text-muted group-hover:border-cinema-accent/30 group-hover:text-cinema-accent"
				>
					{person.knownForDepartment}
				</span>
			{/if}
		</div>

		{#if person.knownForTitles && person.knownForTitles.length > 0}
			<p class="mt-1 line-clamp-1 flex items-center gap-1 text-xs text-cinema-text-muted">
				<Clapperboard class="h-3 w-3 shrink-0 text-cinema-accent/70" />
				<span class="truncate">{person.knownForTitles.slice(0, 3).join(', ')}</span>
			</p>
		{:else}
			<p class="mt-1 text-xs text-cinema-text-muted">Explore full filmography</p>
		{/if}
	</div>
</a>
