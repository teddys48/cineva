<script lang="ts">
	import type { MovieVideo } from '#lib/types/movie';
	import { X, ExternalLink, Play } from 'lucide-svelte';

	interface Props {
		open: boolean;
		trailer: MovieVideo | null;
		movieTitle: string;
		onclose: () => void;
	}

	let { open = $bindable(false), trailer, movieTitle, onclose }: Props = $props();

	let dialogRef: HTMLDivElement | null = $state(null);
	let closeButtonRef: HTMLButtonElement | null = $state(null);

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

	function handleKeyDown(event: KeyboardEvent) {
		if (!open) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			handleClose();
			return;
		}

		// Simple focus trap within dialog
		if (event.key === 'Tab' && dialogRef) {
			const focusableElements = dialogRef.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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

	function handleClose() {
		open = false;
		onclose();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open && trailer}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10"
		role="dialog"
		aria-modal="true"
		aria-labelledby="trailer-modal-title"
		tabindex="-1"
	>
		<!-- Backdrop Scrim -->
		<button
			type="button"
			tabindex="-1"
			class="fixed inset-0 cursor-default bg-black/85 backdrop-blur-sm transition-opacity duration-200"
			onclick={handleBackdropClick}
			aria-label="Close trailer dialog"
		></button>

		<!-- Dialog Panel -->
		<div
			bind:this={dialogRef}
			class="relative z-10 flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-2xl transition-all duration-300"
		>
			<!-- Modal Header -->
			<div
				class="flex items-center justify-between border-b border-cinema-border/70 px-5 py-4 sm:px-6"
			>
				<div class="flex items-center gap-2.5 truncate pr-4">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-lg bg-cinema-accent/15 text-cinema-accent"
					>
						<Play class="h-3.5 w-3.5 fill-current" />
					</div>
					<h2
						id="trailer-modal-title"
						class="truncate font-['Space_Grotesk'] text-base font-bold text-cinema-text sm:text-lg"
					>
						{trailer.name || `${movieTitle} Trailer`}
					</h2>
				</div>

				<div class="flex items-center gap-2">
					<!-- YouTube External Fallback Link -->
					<a
						href="https://www.youtube.com/watch?v={trailer.key}"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1.5 rounded-lg border border-cinema-border/60 bg-cinema-elevated px-2.5 py-1 text-xs font-medium text-cinema-text-muted transition-colors hover:text-cinema-accent focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
						title="Open in YouTube"
					>
						<span class="hidden sm:inline">YouTube</span>
						<ExternalLink class="h-3.5 w-3.5" />
					</a>

					<!-- Close Button -->
					<button
						bind:this={closeButtonRef}
						type="button"
						onclick={handleClose}
						aria-label="Close trailer modal"
						class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cinema-border/60 bg-cinema-elevated text-cinema-text-muted transition-colors hover:bg-cinema-surface hover:text-cinema-text focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
					>
						<X class="h-4 w-4" />
					</button>
				</div>
			</div>

			<!-- Video Frame (Aspect Ratio 16:9, on-demand loaded) -->
			<div class="relative aspect-video w-full bg-black">
				<iframe
					src="https://www.youtube-nocookie.com/embed/{trailer.key}?autoplay=1&rel=0&modestbranding=1"
					title="{movieTitle} - Official Trailer"
					class="h-full w-full border-0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen
				></iframe>
			</div>
		</div>
	</div>
{/if}
