import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
        grey: { 100: "#fffaf0", 200: "#f7f3ea", 300: "#d6dbe6", 400: "#a7adbb", 500: "#747d91", 600: "#4a5365", 700: "#252c3a", 800: "#111722", 900: "#050508" },
        primary: { 100: "#fff7d6", 200: "#fef3c7", 300: "#fde68a", 400: "#171c2a", 500: "#101522", 600: "#0b0f18", 700: "#080b12", 800: "#050508", 900: "#020203" },
        greenAccent: { 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b" },
        redAccent: { 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337" },
        blueAccent: { 100: "#ecfeff", 200: "#cffafe", 300: "#a5f3fc", 400: "#67e8f9", 500: "#22d3ee", 600: "#06b6d4", 700: "#f4c430", 800: "#d4a917", 900: "#7c5f08" },
      }
    : {
        grey: { 100: "#101522", 200: "#1f2937", 300: "#374151", 400: "#4b5563", 500: "#64748b", 600: "#94a3b8", 700: "#cbd5e1", 800: "#e5e7eb", 900: "#fffaf0" },
        primary: { 100: "#050508", 200: "#080b12", 300: "#111722", 400: "#ffffff", 500: "#fffaf0", 600: "#fef3c7", 700: "#fde68a", 800: "#67e8f9", 900: "#22d3ee" },
        greenAccent: { 100: "#064e3b", 200: "#065f46", 300: "#047857", 400: "#059669", 500: "#10b981", 600: "#34d399", 700: "#6ee7b7", 800: "#a7f3d0", 900: "#d1fae5" },
        redAccent: { 100: "#881337", 200: "#9f1239", 300: "#be123c", 400: "#e11d48", 500: "#f43f5e", 600: "#fb7185", 700: "#fda4af", 800: "#fecdd3", 900: "#ffe4e6" },
        blueAccent: { 100: "#7c5f08", 200: "#d4a917", 300: "#f4c430", 400: "#06b6d4", 500: "#22d3ee", 600: "#67e8f9", 700: "#a5f3fc", 800: "#cffafe", 900: "#ecfeff" },
      }),
});

export const themeSettings = (mode) => {
  const colors = tokens(mode);
  return {
    palette: {
      mode,
      ...(mode === "dark"
        ? { primary: { main: colors.primary[500] }, secondary: { main: "#f4c430" }, neutral: { dark: colors.grey[800], main: colors.grey[500], light: colors.grey[100] }, background: { default: "#050508", paper: "rgba(16, 21, 34, 0.94)" } }
        : { primary: { main: colors.primary[500] }, secondary: { main: colors.blueAccent[500] }, neutral: { dark: colors.grey[300], main: colors.grey[500], light: colors.grey[900] }, background: { default: "#fffaf0", paper: "#ffffff" } }),
    },
    typography: {
      fontFamily: ["Inter", "Source Sans 3", "sans-serif"].join(","),
      fontSize: 12,
      h1: { fontSize: 46, fontWeight: 900, letterSpacing: "-0.045em" },
      h2: { fontSize: 35, fontWeight: 900, letterSpacing: "-0.04em" },
      h3: { fontSize: 27, fontWeight: 850, letterSpacing: "-0.03em" },
      h4: { fontSize: 21, fontWeight: 850 },
      h5: { fontSize: 16, fontWeight: 800 },
      h6: { fontSize: 14, fontWeight: 800 },
    },
    shape: { borderRadius: 20 },
    components: {
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none", border: "1px solid rgba(255,255,255,0.105)" } } },
      MuiButton: { styleOverrides: { root: { borderRadius: 999, textTransform: "none", fontWeight: 900 } } },
      MuiCard: { styleOverrides: { root: { backgroundImage: "linear-gradient(145deg, rgba(24,29,43,0.96), rgba(10,13,20,0.92))", border: "1px solid rgba(255,255,255,0.105)" } } },
      MuiFilledInput: { styleOverrides: { root: { border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" } } },
      MuiCssBaseline: { styleOverrides: { body: { scrollbarColor: "#f4c430 #050508" } } },
    },
  };
};

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

export const useMode = () => {
  const [mode, setMode] = useState("dark");
  const colorMode = useMemo(() => ({ toggleColorMode: () => setMode((prev) => (prev === "light" ? "dark" : "light")) }), []);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  return [theme, colorMode];
};
