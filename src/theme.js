import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
        grey: {
          100: "#f8fafc",
          200: "#e5edf8",
          300: "#c6d3e3",
          400: "#9aa7bd",
          500: "#69768d",
          600: "#475569",
          700: "#263246",
          800: "#111827",
          900: "#06070d",
        },
        primary: {
          100: "#ecfeff",
          200: "#cffafe",
          300: "#a5f3fc",
          400: "#182235",
          500: "#101828",
          600: "#0b1220",
          700: "#080d18",
          800: "#05070d",
          900: "#020409",
        },
        greenAccent: {
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        redAccent: {
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
        },
        blueAccent: {
          100: "#f0f9ff",
          200: "#e0f2fe",
          300: "#bae6fd",
          400: "#7dd3fc",
          500: "#38bdf8",
          600: "#0ea5e9",
          700: "#7c3aed",
          800: "#6d28d9",
          900: "#4c1d95",
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
          400: "#ffffff",
          500: "#f8fafc",
          600: "#eef2ff",
          700: "#dbeafe",
          800: "#bae6fd",
          900: "#7dd3fc",
        },
        greenAccent: {
          100: "#064e3b",
          200: "#065f46",
          300: "#047857",
          400: "#059669",
          500: "#10b981",
          600: "#34d399",
          700: "#6ee7b7",
          800: "#a7f3d0",
          900: "#d1fae5",
        },
        redAccent: {
          100: "#881337",
          200: "#9f1239",
          300: "#be123c",
          400: "#e11d48",
          500: "#f43f5e",
          600: "#fb7185",
          700: "#fda4af",
          800: "#fecdd3",
          900: "#ffe4e6",
        },
        blueAccent: {
          100: "#4c1d95",
          200: "#6d28d9",
          300: "#7c3aed",
          400: "#0ea5e9",
          500: "#38bdf8",
          600: "#7dd3fc",
          700: "#bae6fd",
          800: "#e0f2fe",
          900: "#f0f9ff",
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
            secondary: { main: colors.blueAccent[400] },
            neutral: {
              dark: colors.grey[800],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: "#06070d",
              paper: "rgba(17, 24, 39, 0.92)",
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
      fontFamily: ["Inter", "Source Sans 3", "sans-serif"].join(","),
      fontSize: 12,
      h1: { fontSize: 44, fontWeight: 900, letterSpacing: "-0.04em" },
      h2: { fontSize: 34, fontWeight: 900, letterSpacing: "-0.035em" },
      h3: { fontSize: 26, fontWeight: 800, letterSpacing: "-0.025em" },
      h4: { fontSize: 21, fontWeight: 800 },
      h5: { fontSize: 16, fontWeight: 800 },
      h6: { fontSize: 14, fontWeight: 800 },
    },
    shape: { borderRadius: 18 },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            textTransform: "none",
            fontWeight: 800,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "linear-gradient(145deg, rgba(18,25,44,0.96), rgba(9,13,24,0.88))",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          root: {
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
          },
        },
      },
    },
  };
};

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

export const useMode = () => {
  const [mode, setMode] = useState("dark");

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    []
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  return [theme, colorMode];
};
