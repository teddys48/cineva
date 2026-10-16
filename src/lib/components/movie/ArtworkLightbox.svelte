<script lang="ts">
	import type { MovieImage } from '#lib/types/movie';
	import {
		X,
		ChevronLeft,
		ChevronRight,
		ExternalLink,
		Image as ImageIcon,
		Loader2
	} from 'lucide-svelte';

	interface Props {
		open: boolean;
		images: MovieImage[];
		currentIndex: number;
		movieTitle: string;
		onclose: () => void;
		onnavigate: (newIndex: number) => void;
	}

	let {
		open = $bindable(false),
		images,
		currentIndex = 0,
		movieTitle,
		onclose,
		onnavigate
	}: Props = $props();

	let dialogRef: HTMLDivElement | null = $state(null);
	let closeButtonRef: HTMLButtonElement | null = $state(null);
	let imageLoading = $state(true);
	let imageError = $state(false);

	let activeImage = $derived(images[currentIndex] || null);
	let hasNext = $derived(images.length > 1);
	let hasPrev = $derived(images.length > 1);

	// Reset loading state whenever active image changes
	$effect(() => {
		if (activeImage) {
			imageLoading = true;
			imageError = false;
		}
	});

	// Handle body scroll lock and focus management when modal opens/closes
	$effect(() => {
		if (open && typeof document !== 'undefined') {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';

			// Focus close button on open
			setTimeout(() => {
				closeButtonRef?.focus();
			}, 50);

			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	});

	function handleClose() {
		open = false;
		onclose();
	}

	function goToPrevious() {
		if (!images || images.length <= 1) return;
		const nextIdx = (currentIndex - 1 + images.length) % images.length;
		onnavigate(nextIdx);
	}

	function goToNext() {
		if (!images || images.length <= 1) return;
		const nextIdx = (currentIndex + 1) % images.length;
		onnavigate(nextIdx);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!open) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			handleClose();
			return;
		}

		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			goToPrevious();
			return;
		}

		if (event.key === 'ArrowRight') {
			event.preventDefault();
			goToNext();
			return;
		}

		// Focus trap within modal
		if (event.key === 'Tab' && dialogRef) {
			const focusableElements = dialogRef.querySelectorAll<HTMLElement>(
				'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			if (focusableElements.length === 0) return;

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			if (event.shiftKey && document.activeElement === firstElement) {
				event.preventDefault();
				lastElement.focus();
			} else if (!event.shiftKey && document.activeElement === lastElement) {
				event.preventDefault();
				firstElement.focus();
			}
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	let typeLabel = $derived.by(() => {
		if (!activeImage) return '';
		if (activeImage.type === 'poster') return 'Poster';
		if (activeImage.type === 'backdrop') return 'Wallpaper / Backdrop';
		return 'Official Logo';
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open && activeImage}
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-between p-3 sm:p-5 md:p-6"
		role="dialog"
		aria-modal="true"
		aria-label="Artwork preview: {movieTitle} - {typeLabel}"
		tabindex="-1"
	>
		<!-- Backdrop Scrim -->
		<button
			type="button"
			tabindex="-1"
			class="fixed inset-0 cursor-default bg-black/90 backdrop-blur-md transition-opacity duration-200"
			onclick={handleBackdropClick}
			aria-label="Close artwork preview"
		></button>

		<!-- Lightbox Container -->
		<div
			bind:this={dialogRef}
			class="relative z-10 flex h-full w-full max-w-6xl flex-col justify-between overflow-hidden rounded-2xl border border-cinema-border/60 bg-cinema-bg/95 shadow-2xl backdrop-blur-xl"
		>
			<!-- Top Header Bar -->
			<div
				class="flex flex-shrink-0 items-center justify-between border-b border-cinema-border/70 px-4 py-3 sm:px-6 sm:py-3.5"
			>
				<div class="flex items-center gap-3">
					<span
						class="rounded-full border border-cinema-border bg-cinema-surface px-2.5 py-0.5 text-xs font-semibold text-cinema-accent shadow-xs"
					>
						{typeLabel}
					</span>
					<span class="font-mono text-xs text-cinema-text-muted">
						{currentIndex + 1} / {images.length}
					</span>
					{#if activeImage.isPrimary}
						<span
							class="hidden rounded-full border border-cinema-accent/30 bg-cinema-accent/15 px-2 py-0.5 text-[11px] font-medium text-cinema-accent sm:inline-block"
						>
							Hero Artwork
						</span>
					{/if}
				</div>

				<div class="flex items-center gap-2">
					{#if activeImage.originalUrl}
						<a
							href={activeImage.originalUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-cinema-border bg-cinema-surface px-3 text-xs font-medium text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/40 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
							title="Open original resolution image in new tab"
						>
							<span class="hidden sm:inline">Original Resolution</span>
							<span class="sm:hidden">Original</span>
							<ExternalLink class="h-3.5 w-3.5 text-cinema-text-muted" />
						</a>
					{/if}

					<button
						bind:this={closeButtonRef}
						type="button"
						onclick={handleClose}
						class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface text-cinema-text-muted transition-colors hover:bg-cinema-elevated hover:text-cinema-text focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
						aria-label="Close artwork preview (Escape)"
					>
						<X class="h-4 w-4" />
					</button>
				</div>
			</div>

			<!-- Center Image Stage with Navigation Arrows -->
			<div
				class="relative flex flex-1 items-center justify-center overflow-hidden p-2 sm:p-4 md:p-6"
			>
				<!-- Previous Button -->
				{#if hasPrev}
					<button
						type="button"
						onclick={goToPrevious}
						class="absolute left-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-cinema-border/80 bg-cinema-surface/90 text-cinema-text shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-cinema-accent hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none sm:left-6"
						aria-label="Previous artwork (Left arrow key)"
					>
						<ChevronLeft class="h-6 w-6" />
					</button>
				{/if}

				<!-- Active Artwork Viewport -->
				<div class="relative flex h-full w-full items-center justify-center overflow-hidden">
					{#if imageLoading}
						<div class="absolute inset-0 flex flex-col items-center justify-center gap-2">
							<Loader2 class="h-8 w-8 animate-spin text-cinema-accent" />
							<span class="font-mono text-xs text-cinema-text-muted">Loading preview...</span>
						</div>
					{/if}

					{#if imageError}
						<div
							class="flex flex-col items-center justify-center rounded-xl border border-dashed border-cinema-border p-8 text-center"
						>
							<ImageIcon class="h-10 w-10 text-cinema-text-muted opacity-50" />
							<p class="mt-2 text-sm font-semibold text-cinema-text">Unable to display preview</p>
							<p class="mt-1 text-xs text-cinema-text-muted">
								The high-resolution asset could not be loaded from TMDB.
							</p>
						</div>
					{:else}
						<div
							class="flex max-h-full max-w-full items-center justify-center overflow-hidden rounded-xl {activeImage.type ===
							'logo'
								? 'border border-cinema-border/40 bg-radial from-cinema-surface/60 to-cinema-bg/80 p-8'
								: 'shadow-2xl'}"
						>
							<img
								src={activeImage.previewUrl || activeImage.thumbUrl}
								alt="{movieTitle} - {typeLabel} ({activeImage.languageLabel})"
								class="max-h-[68vh] max-w-full object-contain transition-opacity duration-200 sm:max-h-[72vh] md:max-h-[75vh]"
								onload={() => (imageLoading = false)}
								onerror={() => {
									imageLoading = false;
									imageError = true;
								}}
							/>
						</div>
					{/if}
				</div>

				<!-- Next Button -->
				{#if hasNext}
					<button
						type="button"
						onclick={goToNext}
						class="absolute right-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-cinema-border/80 bg-cinema-surface/90 text-cinema-text shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-cinema-accent hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none sm:right-6"
						aria-label="Next artwork (Right arrow key)"
					>
						<ChevronRight class="h-6 w-6" />
					</button>
				{/if}
			</div>

			<!-- Bottom Metadata Bar -->
			<div
				class="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-t border-cinema-border/70 bg-cinema-surface/40 px-4 py-3 sm:px-6"
			>
				<div class="flex flex-wrap items-center gap-2 sm:gap-4">
					{#if activeImage.width && activeImage.height}
						<div class="flex items-center gap-1.5 text-xs text-cinema-text-muted">
							<span class="font-medium text-cinema-text">Dimensions:</span>
							<span class="font-mono">{activeImage.width} × {activeImage.height}</span>
						</div>
					{/if}

					{#if activeImage.aspectRatio}
						<div class="flex items-center gap-1.5 text-xs text-cinema-text-muted">
							<span class="font-medium text-cinema-text">Ratio:</span>
							<span class="font-mono">
								{activeImage.type === 'poster'
									? '2:3'
									: activeImage.type === 'backdrop'
										? '16:9'
										: activeImage.aspectRatio.toFixed(2)}
							</span>
						</div>
					{/if}

					<div class="flex items-center gap-1.5 text-xs text-cinema-text-muted">
						<span class="font-medium text-cinema-text">Language:</span>
						<span
							class="rounded-md border border-cinema-border bg-cinema-surface px-1.5 py-0.5 font-mono text-[11px] text-cinema-text"
						>
							{activeImage.languageLabel}
						</span>
					</div>
				</div>

				<div class="hidden text-xs text-cinema-text-muted md:block">
					<span class="font-mono">← / →</span> Navigate &bull; <span class="font-mono">Esc</span> Close
				</div>
			</div>
		</div>
	</div>
{/if}
