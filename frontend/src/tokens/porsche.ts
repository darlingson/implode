/**
 * Porsche Design System v4 — token reference for Implode.
 *
 * Source of truth: `@porsche-design-system/components-react` v4
 * (Web Components + Tailwind theme + raw JS tokens).
 *
 *   - Global stylesheet: `@import '@porsche-design-system/components-react'`
 *   - Tailwind theme:    `@import '@porsche-design-system/components-react/tailwindcss'`
 *     → utilities like `bg-surface`, `text-primary`, `prose-heading-lg`,
 *       `gap-fluid-md`, `rounded-xl`, `shadow-md`, `scheme-light-dark`
 *   - Raw JS tokens:     `import { … } from '@porsche-design-system/components-react/tokens'`
 *     (e.g. `colorPrimary`, `spacingFluidMd`, `radiusXl`, `shadowMd`)
 *
 * Values below are copied from the v4 docs so the mapping is explicit
 * and reviewable without digging through node_modules. Where the PDS
 * token is theme-aware (`light-dark(…)`), the CSS variable in
 * `tokens.css` preserves that behavior — these TS constants capture the
 * light/dark pair for non-CSS (canvas/SVG/test) use only.
 */

export const porscheColor = {
  canvas: { light: "#fff", dark: "hsl(225 66.7% 1.2%)" },
  surface: { light: "hsl(240 10% 95%)", dark: "hsl(240 2% 10%)" },
  frosted: {
    light: "hsl(240 5% 70% / 0.148)",
    dark: "hsl(240 2% 43% / 0.228)",
  },
  primary: { light: "hsl(225 66.7% 1.2%)", dark: "hsl(225 100% 99%)" },
  contrastHigher: {
    light: "hsl(240 8.7% 9% / 0.8)",
    dark: "hsl(240 12.5% 96.9% / 0.78)",
  },
  contrastHigh: {
    light: "hsl(240 7.1% 11% / 0.7)",
    dark: "hsl(240 12.5% 96.9% / 0.67)",
  },
  contrastMedium: {
    light: "hsl(240 6.1% 7% / 0.6)",
    dark: "hsl(240 12.5% 96.9% / 0.56)",
  },
  info: { light: "hsl(228 83.2% 51%)", dark: "hsl(210 100% 54.5%)" },
  success: { light: "hsl(115 77.5% 27.8%)", dark: "hsl(157 84.9% 41.6%)" },
  warning: { light: "hsl(28 97.7% 34.1%)", dark: "hsl(28 90.2% 56.1%)" },
  error: { light: "hsl(357 78% 41%)", dark: "hsl(0 96.9% 62%)" },
  focus: "#1A44EA",
} as const;

export const porscheSpacing = {
  fluidXs: "clamp(4px, 0.25vw + 3px, 8px)",
  fluidSm: "clamp(8px, 0.5vw + 6px, 16px)",
  fluidMd: "clamp(16px, 1.25vw + 12px, 36px)",
  fluidLg: "clamp(32px, 2.75vw + 23px, 76px)",
  fluidXl: "clamp(48px, 3vw + 38px, 96px)",
  staticXs: "4px",
  staticSm: "8px",
  staticMd: "16px",
  staticLg: "32px",
  staticXl: "48px",
} as const;

export const porscheFont = {
  family: "'Porsche Next','Arial Narrow',Arial,'Heiti SC',SimHei,sans-serif",
  typescale2Xs: ".75rem",
  typescaleXs: ".875rem",
  typescaleSm: "1rem",
  typescaleMd: "clamp(1.13rem, 0.21vw + 1.08rem, 1.33rem)",
  typescaleLg: "clamp(1.27rem, 0.51vw + 1.16rem, 1.78rem)",
  typescaleXl: "clamp(1.42rem, 0.94vw + 1.23rem, 2.37rem)",
  typescale2Xl: "clamp(1.6rem, 1.56vw + 1.29rem, 3.16rem)",
  weightNormal: 400,
  weightSemibold: 600,
  weightBold: 700,
} as const;

export const porscheBorder = {
  radiusXs: "2px",
  radiusSm: "4px",
  radiusMd: "6px",
  radiusLg: "8px",
  /** Primary control radius — PDS visual anchor alongside radius3Xl. */
  radiusXl: "12px",
  radius2Xl: "16px",
  /** Primary container radius — cards, modals, sheets. */
  radius3Xl: "24px",
  radius4Xl: "32px",
  radiusFull: "calc(infinity * 1px)",
} as const;

export const porscheShadow = {
  sm: "0px 3px 8px rgba(0,0,0,.16)",
  md: "0px 4px 16px rgba(0,0,0,.16)",
  lg: "0px 8px 40px rgba(0,0,0,.16)",
} as const;

export const porscheMotion = {
  durationSm: ".25s",
  durationMd: ".4s",
  durationLg: ".6s",
  durationXl: "1.2s",
  easeIn: "cubic-bezier(0,0,.2,1)",
  easeInOut: "cubic-bezier(.25,.1,.25,1)",
  easeOut: "cubic-bezier(.4,0,.5,1)",
} as const;

export const porscheBlur = { frosted: "blur(32px)" } as const;

export const porscheBreakpoint = {
  xs: 480,
  sm: 760,
  md: 1000,
  lg: 1300,
  xl: 1760,
  xxl: 1920,
} as const;
