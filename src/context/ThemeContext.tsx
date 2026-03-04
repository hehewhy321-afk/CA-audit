import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        // Default = light; respect saved preference
        const saved = localStorage.getItem('auditflow-theme');
        if (saved === 'dark' || saved === 'light') return saved;
        // Respect OS preference only if no saved pref
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        return 'light';
    });

    useEffect(() => {
        const root = document.documentElement;
        root.classList.add('theme-transition');
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('auditflow-theme', theme);
        // Remove transition class after animation completes
        const t = setTimeout(() => root.classList.remove('theme-transition'), 400);
        return () => clearTimeout(t);
    }, [theme]);

    const toggleTheme = () => setThemeState(t => t === 'dark' ? 'light' : 'dark');
    const setTheme = (t: Theme) => setThemeState(t);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
