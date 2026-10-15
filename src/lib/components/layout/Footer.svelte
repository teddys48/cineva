<script lang="ts">
	import { Film } from 'lucide-svelte';
</script>

<footer
	class="mt-20 border-t border-cinema-border bg-cinema-bg text-cinema-text-muted transition-colors duration-200"
>
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-4">
			<!-- Brand Info -->
			<div class="md:col-span-2">
				<a href="/" class="flex items-center gap-2.5" aria-label="Scenora Home">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface text-cinema-accent"
					>
						<Film class="h-4 w-4" />
					</div>
					<span class="font-['Space_Grotesk'] text-xl font-bold tracking-tight text-cinema-text">
						Scenora
					</span>
				</a>
				<p class="mt-3 text-sm font-medium text-cinema-accent">Find your next favorite.</p>
				<p class="mt-2 max-w-md text-sm leading-relaxed text-cinema-text-muted">
					An editorial film discovery experience celebrating cinema, visual storytelling, and
					thoughtful curation.
				</p>
			</div>

			<!-- Navigation Links -->
			<div>
				<h3 class="font-['Space_Grotesk'] text-sm font-semibold tracking-wider text-cinema-text">
					EXPLORE
				</h3>
				<ul class="mt-3 space-y-2 text-sm">
					<li>
						<a href="/" class="transition-colors hover:text-cinema-accent">Home</a>
					</li>
					<li>
						<a href="/explore" class="transition-colors hover:text-cinema-accent">Curated Catalog</a
						>
					</li>
					<li>
						<a href="/watchlist" class="transition-colors hover:text-cinema-accent"
							>Personal Watchlist</a
						>
					</li>
					<li>
						<a href="/search" class="transition-colors hover:text-cinema-accent">Search Archive</a>
					</li>
				</ul>
			</div>

			<!-- TMDB Attribution & Compliance Notice -->
			<div>
				<h3 class="font-['Space_Grotesk'] text-sm font-semibold tracking-wider text-cinema-text">
					DATA ATTRIBUTION
				</h3>
				<div class="mt-3">
					<a
						href="https://www.themoviedb.org/"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-block transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
						aria-label="The Movie Database (TMDB)"
					>
						<img
							src="/tmdb-logo.svg"
							alt="The Movie Database (TMDB) Logo"
							class="h-4 w-auto"
							width="123"
							height="16"
							loading="lazy"
						/>
					</a>
					<p class="mt-3 text-xs leading-relaxed text-cinema-text-muted">
						This product uses the TMDB API but is not endorsed or certified by TMDB.
					</p>
				</div>
			</div>
		</div>

		<div
			class="mt-10 flex flex-col items-center justify-between gap-4 border-t border-cinema-border-subtle pt-6 text-xs text-cinema-text-muted sm:flex-row"
		>
			<p>&copy; {new Date().getFullYear()} Scenora. Designed for film lovers.</p>
			<p class="font-mono text-[11px] text-cinema-text-muted/70">Powered by TMDB API v3</p>
		</div>
	</div>
</footer>
