export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'scenora-theme';
const LEGACY_STORAGE_KEY = 'cineva-theme';

export class ThemeState {
	current = $state<Theme>('dark');

	constructor() {
		if (typeof window !== 'undefined') {
			const stored =
				(localStorage.getItem(STORAGE_KEY) as Theme) ||
				(localStorage.getItem(LEGACY_STORAGE_KEY) as Theme);
			if (stored === 'light' || stored === 'dark') {
				this.current = stored;
			} else {
				const isLight =
					document.documentElement.classList.contains('light') ||
					document.documentElement.getAttribute('data-theme') === 'light';
				this.current = isLight ? 'light' : 'dark';
			}
		}
	}

	set(theme: Theme) {
		this.current = theme;
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(STORAGE_KEY, theme);
			} catch {
				// Ignore localStorage quota/private errors
			}

			if (theme === 'light') {
				document.documentElement.classList.remove('dark');
				document.documentElement.classList.add('light');
				document.documentElement.setAttribute('data-theme', 'light');
				const meta = document.querySelector('meta[name="theme-color"]');
				if (meta) meta.setAttribute('content', '#F8F9FA');
			} else {
				document.documentElement.classList.remove('light');
				document.documentElement.classList.add('dark');
				document.documentElement.setAttribute('data-theme', 'dark');
				const meta = document.querySelector('meta[name="theme-color"]');
				if (meta) meta.setAttribute('content', '#0B0D12');
			}
		}
	}

	toggle() {
		this.set(this.current === 'dark' ? 'light' : 'dark');
	}
}

export const themeState = new ThemeState();
