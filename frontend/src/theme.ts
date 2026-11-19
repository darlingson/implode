/**
 * Implode theme — built on Base Web (baseui) LightTheme.
 *
 * Base Web's default LightTheme collapses several key layers to the
 * same #F3F3F3 value: inputFill, inputBorder, borderOpaque,
 * backgroundSecondary, backgroundStateDisabled. That makes fields
 * invisible on secondary backgrounds and kills contrast throughout.
 *
 * This theme separates those layers so the UI reads clearly while
 * staying true to the Base/Uber design language:
 *   - Canvas:          #FFFFFF  (backgroundPrimary)
 *   - Elevated surface:#F7F7F7  (backgroundSecondary) — slightly lifted
 *   - Input fill:      #FFFFFF  (white — fields must stand out from surface)
 *   - Input border:    #CBCBCB  (mono500 — clearly visible, not aggressive)
 *   - Border opaque:   #E2E2E2  (mono400 — separators and card edges)
 *   - Content primary: #000000
 *   - Content secondary:#4B4B4B
 *   - Content tertiary: #6B6B6B
 *   - Accent:          #276EF1  (Uber blue — used sparingly)
 */
import { createTheme, LightTheme } from "baseui";

export const implodeTheme = createTheme({
  colors: {
    /* ── Surfaces ──────────────────────────────────────────────── */
    backgroundPrimary: "#FFFFFF",
    backgroundSecondary: "#F7F7F7",   // slightly warmer than default #F3F3F3
    backgroundTertiary: "#EFEFEF",    // hover / active states

    /* ── Content ───────────────────────────────────────────────── */
    contentPrimary: "#000000",
    contentSecondary: "#4B4B4B",
    contentTertiary: "#6B6B6B",
    contentStateDisabled: "#ABABAB",

    /* ── Borders ───────────────────────────────────────────────── */
    borderOpaque: "#E2E2E2",          // card/section separators
    borderTransparent: "rgba(0,0,0,0.08)",
    borderSelected: "#000000",

    /* ── Inputs — the main fix ─────────────────────────────────── */
    inputFill: "#FFFFFF",             // white so fields pop off the #F7F7F7 surface
    inputFillActive: "#FFFFFF",
    inputFillDisabled: "#F3F3F3",
    inputBorder: "#CBCBCB",           // mono500 — clearly visible border
    inputPlaceholder: "#9A9A9A",

    /* ── Buttons ────────────────────────────────────────────────── */
    buttonPrimaryFill: "#000000",
    buttonPrimaryText: "#FFFFFF",
    buttonSecondaryFill: "#F3F3F3",
    buttonSecondaryText: "#000000",

    /* ── Accent ─────────────────────────────────────────────────── */
    accent: "#276EF1",
    contentAccent: "#276EF1",
    borderAccent: "#276EF1",
  },
  borders: {
    ...LightTheme.borders,
    inputBorderRadius: "8px",
    buttonBorderRadius: "8px",
    radius200: "4px",
    radius300: "6px",
    radius400: "8px",
  },
  typography: {
    ...LightTheme.typography,
    // "Go big" — Uber's first type principle
    ParagraphMedium: { ...LightTheme.typography.ParagraphMedium, fontSize: "15px", lineHeight: "24px" },
    ParagraphSmall:  { ...LightTheme.typography.ParagraphSmall,  fontSize: "14px", lineHeight: "20px" },
    LabelMedium:     { ...LightTheme.typography.LabelMedium,     fontSize: "14px", lineHeight: "20px" },
    LabelSmall:      { ...LightTheme.typography.LabelSmall,      fontSize: "13px", lineHeight: "20px" },
    LabelXSmall:     { ...LightTheme.typography.LabelXSmall,     fontSize: "12px", lineHeight: "16px" },
  },
});
