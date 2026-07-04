import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
        grey: {
          100: "#f8fafc",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        primary: {
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#0f172a",
          600: "#0b1220",
          700: "#070d18",
          800: "#030712",
          900: "#020617",
        },
        greenAccent: {
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        redAccent: {
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        blueAccent: {
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      }
    : {
        grey: {
          100: "#0f172a",
          200: "#1e293b",
          300: "#334155",
          400: "#475569",
          500: "#64748b",
          600: "#94a3b8",
          700: "#cbd5e1",
          800: "#e2e8f0",
          900: "#f8fafc",
        },
        primary: {
          100: "#020617",
          200: "#030712",
          300: "#070d18",
          400: "#f8fafc",
          500: "#ffffff",
          600: "#eef2ff",
          700: "#c7d2fe",
          800: "#a5b4fc",
          900: "#818cf8",
        },
        greenAccent: {
          100: "#14532d",
          200: "#166534",
          300: "#15803d",
          400: "#16a34a",
          500: "#22c55e",
          600: "#4ade80",
          700: "#86efac",
          800: "#bbf7d0",
          900: "#dcfce7",
        },
        redAccent: {
          100: "#7f1d1d",
          200: "#991b1b",
          300: "#b91c1c",
          400: "#dc2626",
          500: "#ef4444",
          600: "#f87171",
          700: "#fca5a5",
          800: "#fecaca",
          900: "#fee2e2",
        },
        blueAccent: {
          100: "#312e81",
          200: "#3730a3",
          300: "#4338ca",
          400: "#4f46e5",
          500: "#6366f1",
          600: "#818cf8",
          700: "#a5b4fc",
          800: "#c7d2fe",
          900: "#e0e7ff",
        },
      }),
});

export const themeSettings = (mode) => {
  const colors = tokens(mode);
  return {
    palette: {
      mode,
      ...(mode === "dark"
        ? {
            primary: { main: colors.primary[500] },
            secondary: { main: colors.blueAccent[500] },
            neutral: {
              dark: colors.grey[800],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: "#020617",
              paper: "rgba(15, 23, 42, 0.86)",
            },
          }
        : {
            primary: { main: colors.primary[500] },
            secondary: { main: colors.blueAccent[500] },
            neutral: {
              dark: colors.grey[300],
              main: colors.grey[500],
              light: colors.grey[900],
            },
            background: {
              default: "#f8fafc",
              paper: "#ffffff",
            },
          }),
    },
    typography: {
      fontFamily: ["Inter", "Source Sans Pro", "sans-serif"].join(","),
      fontSize: 12,
      h1: { fontFamily: ["Inter", "sans-serif"].join(","), fontSize: 42, fontWeight: 800 },
      h2: { fontFamily: ["Inter", "sans-serif"].join(","), fontSize: 34, fontWeight: 800 },
      h3: { fontFamily: ["Inter", "sans-serif"].join(","), fontSize: 26, fontWeight: 700 },
      h4: { fontFamily: ["Inter", "sans-serif"].join(","), fontSize: 21, fontWeight: 700 },
      h5: { fontFamily: ["Inter", "sans-serif"].join(","), fontSize: 16, fontWeight: 700 },
      h6: { fontFamily: ["Inter", "sans-serif"].join(","), fontSize: 14, fontWeight: 700 },
    },
    shape: {
      borderRadius: 14,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: "1px solid rgba(148, 163, 184, 0.14)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: "none",
            fontWeight: 700,
          },
        },
      },
    },
  };
};

export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

export const useMode = () => {
  const [mode, setMode] = useState("dark");

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    []
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  return [theme, colorMode];
};
