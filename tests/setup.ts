// Preload for bun test environment to support Svelte 5 runes during unit testing
const globalScope = globalThis as unknown as Record<string, unknown>;

if (typeof globalScope.$state === 'undefined') {
	const stateFn = <T>(initial: T): T => initial;
	globalScope.$state = stateFn;
}
