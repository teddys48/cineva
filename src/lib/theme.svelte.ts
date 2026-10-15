export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'cineva-theme';

class ThemeState {
	current = $state<Theme>('dark');

	constructor() {
		if (typeof window !== 'undefined') {
			const isLight =
				document.documentElement.classList.contains('light') ||
				document.documentElement.getAttribute('data-theme') === 'light';
			this.current = isLight ? 'light' : 'dark';
		}
	}

	set(theme: Theme) {
		this.current = theme;
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(STORAGE_KEY, theme);
			} catch {
				// Local storage disabled or quota exceeded
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
