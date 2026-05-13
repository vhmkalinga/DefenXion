import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { darkTheme, lightTheme, Theme } from '../constants/theme';
import { getAppSettings } from '../constants/api';

const THEME_STORAGE_KEY = 'defenxion_dark_mode';

// Simple cross-platform persistence for theme preference
function readPersistedTheme(): boolean | null {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored !== null) return stored === 'true';
    }
  } catch { /* ignore */ }
  return null;
}

function persistTheme(isDark: boolean) {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, String(isDark));
    }
  } catch { /* ignore */ }
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setDark: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  isDark: true,
  setDark: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  // Init from local persistence, fall back to system preference, then dark
  const [isDark, setIsDarkRaw] = useState<boolean>(() => {
    const persisted = readPersistedTheme();
    if (persisted !== null) return persisted;
    return systemColorScheme !== 'light';
  });

  // Wrapped setter that also persists the choice
  const setDark = useCallback((dark: boolean) => {
    setIsDarkRaw(dark);
    persistTheme(dark);
  }, []);

  useEffect(() => {
    async function loadTheme() {
      try {
        const settings = await getAppSettings();
        if (settings && settings.dark_mode !== undefined) {
          setDark(settings.dark_mode);
        }
      } catch (e) {
        // API failed (likely 401) — persisted or initial value is already in use, no action needed
      }
    }
    loadTheme();
  }, [setDark]);

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  // Fallback guard: should never be undefined since we provide a default,
  // but protects against any context timing edge cases.
  if (!ctx || !ctx.theme) {
    return { theme: darkTheme, isDark: true, setDark: () => {} };
  }
  return ctx;
};
