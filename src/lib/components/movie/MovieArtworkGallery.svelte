<script lang="ts">
	import type { MovieImagesGallery, MovieImage } from '#lib/types/movie';
	import ArtworkLightbox from '#lib/components/movie/ArtworkLightbox.svelte';
	import SectionError from '#lib/components/ui/SectionError.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import { Images, Maximize2, Image as ImageIcon } from 'lucide-svelte';

	interface Props {
		gallery: MovieImagesGallery;
		movieTitle: string;
	}

	let { gallery, movieTitle }: Props = $props();

	type GalleryTab = 'all' | 'posters' | 'backdrops' | 'logos';
	let activeTab = $state<GalleryTab>('all');

	// Lightbox State
	let lightboxOpen = $state(false);
	let lightboxIndex = $state(0);
	let lightboxCollection = $state<MovieImage[]>([]);

	let categories = $derived([
		{ id: 'all' as GalleryTab, label: 'All', count: gallery.totalCount },
		{ id: 'posters' as GalleryTab, label: 'Posters', count: gallery.posters.length },
		{
			id: 'backdrops' as GalleryTab,
			label: 'Wallpapers / Backdrops',
			count: gallery.backdrops.length
		},
		{ id: 'logos' as GalleryTab, label: 'Logos', count: gallery.logos.length }
	]);

	let activeItems = $derived.by(() => {
		if (activeTab === 'posters') return gallery.posters;
		if (activeTab === 'backdrops') return gallery.backdrops;
		if (activeTab === 'logos') return gallery.logos;
		return gallery.all;
	});

	function openLightbox(image: MovieImage, collection: MovieImage[]) {
		const idx = collection.findIndex((item) => item.id === image.id);
		lightboxIndex = idx >= 0 ? idx : 0;
		lightboxCollection = collection;
		lightboxOpen = true;
	}

	function closeLightbox() {
		lightboxOpen = false;
	}

	function navigateLightbox(newIndex: number) {
		lightboxIndex = newIndex;
	}

	function handleTabKeyDown(event: KeyboardEvent, index: number) {
		const tabCount = categories.length;
		let nextIndex = -1;

		if (event.key === 'ArrowRight') {
			nextIndex = (index + 1) % tabCount;
		} else if (event.key === 'ArrowLeft') {
			nextIndex = (index - 1 + tabCount) % tabCount;
		}

		if (nextIndex >= 0) {
			event.preventDefault();
			const nextTab = categories[nextIndex].id;
			activeTab = nextTab;
			const targetEl = document.getElementById(`gallery-tab-${nextTab}`);
			targetEl?.focus();
		}
	}
</script>

<div class="w-full">
	<!-- Gallery Header & Category Filters -->
	<div
		class="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end lg:mb-10"
	>
		<div>
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-xl border border-cinema-border bg-cinema-surface text-cinema-accent shadow-xs"
				>
					<Images class="h-4 w-4" />
				</div>
				<h2
					class="font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-cinema-text sm:text-3xl"
				>
					Artwork Gallery
				</h2>
			</div>
			<p class="mt-1 text-xs text-cinema-text-muted sm:text-sm">
				Official high-resolution posters, wallpapers, and logos from TMDB
			</p>
		</div>

		<!-- Category Filter Tabs -->
		{#if !gallery.error && gallery.totalCount > 0}
			<div
				class="flex flex-wrap items-center gap-1.5 rounded-2xl border border-cinema-border bg-cinema-surface/60 p-1.5 shadow-xs backdrop-blur-xs"
				role="tablist"
				aria-label="Filter artwork by category"
			>
				{#each categories as category, idx (category.id)}
					<button
						id="gallery-tab-{category.id}"
						type="button"
						role="tab"
						aria-selected={activeTab === category.id}
						aria-controls="gallery-tabpanel"
						tabindex={activeTab === category.id ? 0 : -1}
						onclick={() => (activeTab = category.id)}
						onkeydown={(e) => handleTabKeyDown(e, idx)}
						class="flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none {activeTab ===
						category.id
							? 'bg-cinema-accent font-semibold text-cinema-accent-foreground shadow-xs'
							: 'text-cinema-text-muted hover:bg-cinema-elevated hover:text-cinema-text'}"
					>
						<span>{category.label}</span>
						<span
							class="py-0.2 rounded-full px-1.5 font-mono text-[10px] {activeTab === category.id
								? 'bg-black/20 font-bold text-cinema-accent-foreground'
								: 'bg-cinema-elevated text-cinema-text-muted'}"
						>
							{category.count}
						</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Gallery Content Panel -->
	<div id="gallery-tabpanel" role="tabpanel" aria-labelledby="gallery-tab-{activeTab}">
		<!-- Error State -->
		{#if gallery.error}
			<SectionError title="Artwork Collection Unavailable" message={gallery.error} />
			<!-- Complete Empty State -->
		{:else if gallery.totalCount === 0}
			<EmptyState
				icon={ImageIcon}
				title="No Artwork Available"
				description="Official promotional assets and artwork for this film have not been published to TMDB yet."
			/>
			<!-- Category-Specific Empty State -->
		{:else if activeItems.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cinema-border bg-cinema-surface/40 p-10 text-center"
			>
				<div
					class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-cinema-border bg-cinema-elevated text-cinema-text-muted"
				>
					<ImageIcon class="h-6 w-6" />
				</div>
				<h3 class="font-['Space_Grotesk'] text-base font-semibold text-cinema-text">
					No {activeTab === 'posters'
						? 'Posters'
						: activeTab === 'backdrops'
							? 'Wallpapers'
							: 'Logos'} Available
				</h3>
				<p class="mt-1 max-w-sm text-xs text-cinema-text-muted">
					No {activeTab} were found for this film in the requested languages. You can view other available
					categories.
				</p>
				<button
					type="button"
					onclick={() => (activeTab = 'all')}
					class="mt-4 rounded-xl border border-cinema-border bg-cinema-surface px-4 py-2 text-xs font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
				>
					View All Artwork ({gallery.totalCount})
				</button>
			</div>
			<!-- All Tab (Structured by section for distinct aspect ratios) -->
		{:else if activeTab === 'all'}
			<div class="space-y-12">
				<!-- Wallpapers / Backdrops (16:9 Landscape) -->
				{#if gallery.backdrops.length > 0}
					<div>
						<div class="mb-4 flex items-center justify-between">
							<h3 class="font-['Space_Grotesk'] text-lg font-bold text-cinema-text">
								Wallpapers & Backdrops
								<span class="ml-2 font-mono text-xs font-normal text-cinema-text-muted">
									({gallery.backdrops.length})
								</span>
							</h3>
							<button
								type="button"
								onclick={() => (activeTab = 'backdrops')}
								class="text-xs font-medium text-cinema-accent transition-colors hover:underline"
							>
								Filter Backdrops Only
							</button>
						</div>

						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
							{#each gallery.backdrops as backdrop (backdrop.id)}
								<button
									type="button"
									onclick={() => openLightbox(backdrop, gallery.backdrops)}
									class="group relative overflow-hidden rounded-2xl border border-cinema-border/70 bg-cinema-surface shadow-xs transition-all duration-300 hover:border-cinema-accent/50 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none active:scale-[0.99]"
									aria-label="View larger wallpaper: {movieTitle} ({backdrop.width}×{backdrop.height}, {backdrop.languageLabel})"
								>
									<div class="relative aspect-[16/9] w-full overflow-hidden bg-cinema-elevated">
										<img
											src={backdrop.thumbUrl}
											alt="{movieTitle} Wallpaper ({backdrop.languageLabel})"
											loading="lazy"
											decoding="async"
											width={backdrop.width}
											height={backdrop.height}
											class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
										/>

										<!-- Badges Overlay -->
										<div
											class="absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between gap-2"
										>
											<div class="flex items-center gap-1.5">
												{#if backdrop.isPrimary}
													<span
														class="rounded-md border border-cinema-accent/40 bg-cinema-accent px-2 py-0.5 font-mono text-[10px] font-bold text-cinema-accent-foreground shadow-xs"
													>
														Hero
													</span>
												{/if}
												<span
													class="rounded-md border border-white/10 bg-black/70 px-2 py-0.5 font-mono text-[10px] font-medium text-cinema-text shadow-xs backdrop-blur-xs"
												>
													{backdrop.languageLabel}
												</span>
											</div>

											<span
												class="rounded-md border border-white/10 bg-black/70 px-2 py-0.5 font-mono text-[10px] text-cinema-text-muted shadow-xs backdrop-blur-xs"
											>
												{backdrop.width}×{backdrop.height}
											</span>
										</div>

										<!-- Hover Preview Hint -->
										<div
											class="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100"
										>
											<div
												class="flex h-10 w-10 items-center justify-center rounded-full border border-cinema-accent/50 bg-cinema-surface/90 text-cinema-accent shadow-lg backdrop-blur-xs"
											>
												<Maximize2 class="h-4 w-4" />
											</div>
										</div>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Posters (2:3 Portrait) -->
				{#if gallery.posters.length > 0}
					<div>
						<div class="mb-4 flex items-center justify-between">
							<h3 class="font-['Space_Grotesk'] text-lg font-bold text-cinema-text">
								Posters
								<span class="ml-2 font-mono text-xs font-normal text-cinema-text-muted">
									({gallery.posters.length})
								</span>
							</h3>
							<button
								type="button"
								onclick={() => (activeTab = 'posters')}
								class="text-xs font-medium text-cinema-accent transition-colors hover:underline"
							>
								Filter Posters Only
							</button>
						</div>

						<div
							class="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5"
						>
							{#each gallery.posters as poster (poster.id)}
								<button
									type="button"
									onclick={() => openLightbox(poster, gallery.posters)}
									class="group relative overflow-hidden rounded-2xl border border-cinema-border/70 bg-cinema-surface shadow-xs transition-all duration-300 hover:border-cinema-accent/50 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none active:scale-[0.99]"
									aria-label="View larger poster: {movieTitle} ({poster.width}×{poster.height}, {poster.languageLabel})"
								>
									<div class="relative aspect-[2/3] w-full overflow-hidden bg-cinema-elevated">
										<img
											src={poster.thumbUrl}
											alt="{movieTitle} Poster ({poster.languageLabel})"
											loading="lazy"
											decoding="async"
											width={poster.width}
											height={poster.height}
											class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
										/>

										<!-- Badges Overlay -->
										<div
											class="absolute top-2 right-2 left-2 flex items-center justify-between gap-1.5"
										>
											<div class="flex items-center gap-1">
												{#if poster.isPrimary}
													<span
														class="rounded-md border border-cinema-accent/40 bg-cinema-accent px-1.5 py-0.5 font-mono text-[9px] font-bold text-cinema-accent-foreground shadow-xs"
													>
														Hero
													</span>
												{/if}
												<span
													class="rounded-md border border-white/10 bg-black/70 px-1.5 py-0.5 font-mono text-[9px] font-medium text-cinema-text shadow-xs backdrop-blur-xs"
												>
													{poster.languageLabel}
												</span>
											</div>

											<span
												class="rounded-md border border-white/10 bg-black/70 px-1.5 py-0.5 font-mono text-[9px] text-cinema-text-muted shadow-xs backdrop-blur-xs"
											>
												{poster.width}×{poster.height}
											</span>
										</div>

										<!-- Hover Preview Hint -->
										<div
											class="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100"
										>
											<div
												class="flex h-9 w-9 items-center justify-center rounded-full border border-cinema-accent/50 bg-cinema-surface/90 text-cinema-accent shadow-lg backdrop-blur-xs"
											>
												<Maximize2 class="h-4 w-4" />
											</div>
										</div>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Logos -->
				{#if gallery.logos.length > 0}
					<div>
						<div class="mb-4 flex items-center justify-between">
							<h3 class="font-['Space_Grotesk'] text-lg font-bold text-cinema-text">
								Official Logos
								<span class="ml-2 font-mono text-xs font-normal text-cinema-text-muted">
									({gallery.logos.length})
								</span>
							</h3>
							<button
								type="button"
								onclick={() => (activeTab = 'logos')}
								class="text-xs font-medium text-cinema-accent transition-colors hover:underline"
							>
								Filter Logos Only
							</button>
						</div>

						<div class="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
							{#each gallery.logos as logo (logo.id)}
								<button
									type="button"
									onclick={() => openLightbox(logo, gallery.logos)}
									class="group relative overflow-hidden rounded-2xl border border-cinema-border/70 bg-gradient-to-br from-cinema-surface via-cinema-elevated to-cinema-surface shadow-xs transition-all duration-300 hover:border-cinema-accent/50 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none active:scale-[0.99]"
									aria-label="View larger logo: {movieTitle} ({logo.width}×{logo.height}, {logo.languageLabel})"
								>
									<div
										class="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden p-6"
									>
										<img
											src={logo.thumbUrl}
											alt="{movieTitle} Logo ({logo.languageLabel})"
											loading="lazy"
											decoding="async"
											width={logo.width}
											height={logo.height}
											class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110"
										/>

										<!-- Badges Overlay -->
										<div
											class="absolute top-2 right-2 left-2 flex items-center justify-between gap-1.5"
										>
											<span
												class="rounded-md border border-white/10 bg-black/70 px-1.5 py-0.5 font-mono text-[9px] font-medium text-cinema-text shadow-xs backdrop-blur-xs"
											>
												{logo.languageLabel}
											</span>
											<span
												class="rounded-md border border-white/10 bg-black/70 px-1.5 py-0.5 font-mono text-[9px] text-cinema-text-muted shadow-xs backdrop-blur-xs"
											>
												{logo.width}×{logo.height}
											</span>
										</div>

										<!-- Hover Preview Hint -->
										<div
											class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100"
										>
											<div
												class="flex h-9 w-9 items-center justify-center rounded-full border border-cinema-accent/50 bg-cinema-surface/90 text-cinema-accent shadow-lg backdrop-blur-xs"
											>
												<Maximize2 class="h-4 w-4" />
											</div>
										</div>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Single Category Active Tab -->
		{:else}
			<div
				class={activeTab === 'posters'
					? 'grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5'
					: activeTab === 'backdrops'
						? 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3'
						: 'grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4'}
			>
				{#each activeItems as item (item.id)}
					<button
						type="button"
						onclick={() => openLightbox(item, activeItems)}
						class="group relative overflow-hidden rounded-2xl border border-cinema-border/70 bg-cinema-surface shadow-xs transition-all duration-300 hover:border-cinema-accent/50 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none active:scale-[0.99]"
						aria-label="View larger {item.type}: {movieTitle} ({item.width}×{item.height}, {item.languageLabel})"
					>
						<div
							class="relative w-full overflow-hidden {item.type === 'poster'
								? 'aspect-[2/3] bg-cinema-elevated'
								: item.type === 'backdrop'
									? 'aspect-[16/9] bg-cinema-elevated'
									: 'flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-cinema-surface via-cinema-elevated to-cinema-surface p-6'}"
						>
							<img
								src={item.thumbUrl}
								alt="{movieTitle} {item.type} ({item.languageLabel})"
								loading="lazy"
								decoding="async"
								width={item.width}
								height={item.height}
								class={item.type === 'logo'
									? 'max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110'
									: 'h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'}
							/>

							<!-- Badges Overlay -->
							<div
								class="absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between gap-1.5"
							>
								<div class="flex items-center gap-1.5">
									{#if item.isPrimary}
										<span
											class="rounded-md border border-cinema-accent/40 bg-cinema-accent px-2 py-0.5 font-mono text-[10px] font-bold text-cinema-accent-foreground shadow-xs"
										>
											Hero
										</span>
									{/if}
									<span
										class="rounded-md border border-white/10 bg-black/70 px-2 py-0.5 font-mono text-[10px] font-medium text-cinema-text shadow-xs backdrop-blur-xs"
									>
										{item.languageLabel}
									</span>
								</div>

								<span
									class="rounded-md border border-white/10 bg-black/70 px-2 py-0.5 font-mono text-[10px] text-cinema-text-muted shadow-xs backdrop-blur-xs"
								>
									{item.width}×{item.height}
								</span>
							</div>

							<!-- Hover Preview Hint -->
							<div
								class="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100"
							>
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full border border-cinema-accent/50 bg-cinema-surface/90 text-cinema-accent shadow-lg backdrop-blur-xs"
								>
									<Maximize2 class="h-4 w-4" />
								</div>
							</div>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Lightbox Modal -->
{#if lightboxOpen}
	<ArtworkLightbox
		bind:open={lightboxOpen}
		images={lightboxCollection}
		currentIndex={lightboxIndex}
		{movieTitle}
		onclose={closeLightbox}
		onnavigate={navigateLightbox}
	/>
{/if}
