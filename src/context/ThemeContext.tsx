import React, { useState, createContext, useContext } from 'react';

export type ColorMode = 'vibrant' | 'monochrome' | 'minimal';

export const VIBRANT_COLORS = ['#10b981', '#3b82f6', '#ef4444', '#1c1c1e', '#f59e0b']; // Green, Blue, Red, Black, Amber
export const MONOCHROME_COLORS = ['#52525b', '#71717a', '#a1a1aa', '#1c1c1e', '#52525b'];
export const MINIMAL_COLORS = ['#10b981', '#3b82f6', '#ef4444', '#1c1c1e', '#f59e0b']; // Same as vibrant but with soft bg

interface ThemeContextProps {
  isDark: boolean;
  colorMode: ColorMode;
  themeColors: readonly string[];
  toggleTheme: () => void;
  setColorMode: (mode: ColorMode) => void;
  setIsDark: (val: boolean) => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  isDark: false,
  colorMode: 'vibrant',
  themeColors: VIBRANT_COLORS,
  toggleTheme: () => {},
  setColorMode: () => {},
  setIsDark: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>('vibrant');

  const toggleTheme = () => setIsDark(prev => !prev);

  let themeColors = VIBRANT_COLORS;
  if (colorMode === 'monochrome') themeColors = MONOCHROME_COLORS;
  // minimal has the same text/accent colors as vibrant, but the card bg is handled locally in TestScreen

  return (
    <ThemeContext.Provider 
      value={{ 
        isDark, 
        setIsDark,
        colorMode, 
        setColorMode,
        toggleTheme, 
        themeColors
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);
