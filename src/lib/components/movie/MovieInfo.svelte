<script lang="ts">
	import type { MovieDetail } from '#lib/types/movie';
	import {
		Calendar,
		Clock,
		Globe,
		Building2,
		DollarSign,
		TrendingUp,
		ExternalLink,
		Clapperboard
	} from 'lucide-svelte';

	interface Props {
		movie: MovieDetail;
	}

	let { movie }: Props = $props();

	// Format votes with commas
	const formattedVotes = $derived(
		movie.voteCount && movie.voteCount > 0
			? new Intl.NumberFormat('en-US').format(movie.voteCount)
			: null
	);

	const hasProductionCompanies = $derived(
		movie.productionCompanies && movie.productionCompanies.length > 0
	);
	const hasProductionCountries = $derived(
		movie.productionCountries && movie.productionCountries.length > 0
	);
</script>

<div class="grid grid-cols-1 gap-10 lg:grid-cols-3" aria-label="Movie Information">
	<!-- Left 2 Cols: Synopsis & Extended Context -->
	<div class="space-y-8 lg:col-span-2">
		<!-- Synopsis Section -->
		<div>
			<h2 class="font-['Space_Grotesk'] text-xl font-bold text-cinema-text sm:text-2xl">
				Synopsis
			</h2>
			<p class="mt-3 text-base leading-relaxed text-cinema-text/90 sm:text-lg sm:leading-relaxed">
				{movie.overview}
			</p>
		</div>

		<!-- Production Companies & Countries if available -->
		{#if hasProductionCompanies || hasProductionCountries}
			<div class="rounded-2xl border border-cinema-border/70 bg-cinema-surface/60 p-6 sm:p-7">
				<h3 class="font-['Space_Grotesk'] text-base font-semibold text-cinema-text">
					Production Details
				</h3>

				<div class="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
					{#if hasProductionCompanies}
						<div>
							<div
								class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-text-muted uppercase"
							>
								<Building2 class="h-3.5 w-3.5 text-cinema-accent" />
								<span>Production Companies</span>
							</div>
							<p class="mt-1.5 text-sm text-cinema-text">
								{movie.productionCompanies.join(' &bull; ')}
							</p>
						</div>
					{/if}

					{#if hasProductionCountries}
						<div>
							<div
								class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-cinema-text-muted uppercase"
							>
								<Globe class="h-3.5 w-3.5 text-cinema-accent" />
								<span>Countries of Origin</span>
							</div>
							<p class="mt-1.5 text-sm text-cinema-text">
								{movie.productionCountries.join(', ')}
							</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- External Links -->
		{#if movie.homepage || movie.imdbId}
			<div class="flex flex-wrap items-center gap-3 pt-2">
				{#if movie.imdbId}
					<a
						href="https://www.imdb.com/title/{movie.imdbId}/"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface px-4 py-2 text-xs font-semibold text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/50 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
					>
						<span>IMDb Entry</span>
						<ExternalLink class="h-3.5 w-3.5 text-cinema-text-muted" />
					</a>
				{/if}

				{#if movie.homepage}
					<a
						href={movie.homepage}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface px-4 py-2 text-xs font-semibold text-cinema-text shadow-xs transition-colors hover:border-cinema-accent/50 hover:bg-cinema-elevated focus-visible:ring-2 focus-visible:ring-cinema-accent focus-visible:outline-none"
					>
						<span>Official Website</span>
						<ExternalLink class="h-3.5 w-3.5 text-cinema-text-muted" />
					</a>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Right Col: Structured Specification Sidebar -->
	<div class="lg:col-span-1">
		<div
			class="sticky top-20 rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-xs sm:p-7"
		>
			<h3 class="font-['Space_Grotesk'] text-lg font-bold text-cinema-text">Film Specifications</h3>

			<dl class="mt-5 divide-y divide-cinema-border/60 text-sm">
				<!-- Director(s) -->
				{#if movie.keyCrew?.directorsList && movie.keyCrew.directorsList.length > 0}
					<div class="flex items-center justify-between py-3">
						<dt class="flex items-center gap-1.5 text-xs font-medium text-cinema-text-muted">
							<Clapperboard class="h-3.5 w-3.5" />
							<span>Director{movie.keyCrew.directorsList.length > 1 ? 's' : ''}</span>
						</dt>
						<dd class="text-right text-xs font-medium text-cinema-text">
							{#each movie.keyCrew.directorsList as director, i (director.id)}
								{#if i > 0},
								{/if}
								<a
									href="/person/{director.id}"
									class="transition-colors hover:text-cinema-accent hover:underline focus-visible:rounded-xs focus-visible:ring-1 focus-visible:ring-cinema-accent focus-visible:outline-none"
								>
									{director.name}
								</a>
							{/each}
						</dd>
					</div>
				{:else if movie.director}
					<div class="flex items-center justify-between py-3">
						<dt class="flex items-center gap-1.5 text-xs font-medium text-cinema-text-muted">
							<Clapperboard class="h-3.5 w-3.5" />
							<span>Director</span>
						</dt>
						<dd class="text-right text-xs font-medium text-cinema-text">{movie.director}</dd>
					</div>
				{/if}

				<!-- Status -->
				{#if movie.status}
					<div class="flex items-center justify-between py-3">
						<dt class="text-xs font-medium text-cinema-text-muted">Status</dt>
						<dd class="font-medium text-cinema-text">{movie.status}</dd>
					</div>
				{/if}

				<!-- Release Date -->
				{#if movie.releaseDateText}
					<div class="flex items-center justify-between py-3">
						<dt class="flex items-center gap-1.5 text-xs font-medium text-cinema-text-muted">
							<Calendar class="h-3.5 w-3.5" />
							<span>Release Date</span>
						</dt>
						<dd class="font-mono text-xs text-cinema-text">{movie.releaseDateText}</dd>
					</div>
				{/if}

				<!-- Runtime -->
				{#if movie.runtime}
					<div class="flex items-center justify-between py-3">
						<dt class="flex items-center gap-1.5 text-xs font-medium text-cinema-text-muted">
							<Clock class="h-3.5 w-3.5" />
							<span>Runtime</span>
						</dt>
						<dd class="font-mono text-xs text-cinema-text">{movie.runtime}</dd>
					</div>
				{/if}

				<!-- Original Language -->
				{#if movie.originalLanguage}
					<div class="flex items-center justify-between py-3">
						<dt class="flex items-center gap-1.5 text-xs font-medium text-cinema-text-muted">
							<Globe class="h-3.5 w-3.5" />
							<span>Original Language</span>
						</dt>
						<dd class="font-medium text-cinema-text">{movie.originalLanguage}</dd>
					</div>
				{/if}

				<!-- Original Title (if different) -->
				{#if movie.originalTitle}
					<div class="flex items-center justify-between py-3">
						<dt class="text-xs font-medium text-cinema-text-muted">Original Title</dt>
						<dd
							class="max-w-[180px] truncate text-right font-medium text-cinema-text"
							title={movie.originalTitle}
						>
							{movie.originalTitle}
						</dd>
					</div>
				{/if}

				<!-- Budget -->
				{#if movie.budgetText}
					<div class="flex items-center justify-between py-3">
						<dt class="flex items-center gap-1.5 text-xs font-medium text-cinema-text-muted">
							<DollarSign class="h-3.5 w-3.5" />
							<span>Budget</span>
						</dt>
						<dd class="font-mono text-xs text-cinema-text">{movie.budgetText}</dd>
					</div>
				{/if}

				<!-- Revenue -->
				{#if movie.revenueText}
					<div class="flex items-center justify-between py-3">
						<dt class="flex items-center gap-1.5 text-xs font-medium text-cinema-text-muted">
							<TrendingUp class="h-3.5 w-3.5" />
							<span>Box Office Revenue</span>
						</dt>
						<dd class="font-mono text-xs text-cinema-text">{movie.revenueText}</dd>
					</div>
				{/if}

				<!-- Rating & Vote Count -->
				{#if movie.rating != null && movie.rating > 0}
					<div class="flex items-center justify-between py-3">
						<dt class="text-xs font-medium text-cinema-text-muted">User Rating</dt>
						<dd class="flex items-center gap-1 text-xs font-bold text-cinema-accent">
							<span>{movie.rating.toFixed(1)} / 10</span>
							{#if formattedVotes}
								<span class="text-xs font-normal text-cinema-text-muted"
									>({formattedVotes} votes)</span
								>
							{/if}
						</dd>
					</div>
				{/if}
			</dl>
		</div>
	</div>
</div>
