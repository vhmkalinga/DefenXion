import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAppSettings } from '../services/api';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
    setDark: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    isDark: true,
    toggleTheme: () => { },
    setDark: () => { },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState(() => {
        const stored = localStorage.getItem('defenxion_dark_mode');
        return stored !== null ? stored === 'true' : true;
    });

    // Apply theme class to document
    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
        }
        localStorage.setItem('defenxion_dark_mode', String(isDark));
    }, [isDark]);

    // Sync with backend settings on mount
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            getAppSettings().then(data => {
                if (data && data.dark_mode !== undefined) {
                    setIsDark(data.dark_mode);
                }
            }).catch(() => { });
        }
    }, []);

    const toggleTheme = () => setIsDark(prev => !prev);
    const setDark = (dark: boolean) => setIsDark(dark);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, setDark }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
