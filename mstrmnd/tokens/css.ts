import { blur, color, radius } from '@/tokens';

const cssVars = `
  --linear-substrate: ${color.substrate};
  --linear-obsidian: ${color.substrateObsidian};
  --linear-surface: ${color.surface};
  --linear-elevated: ${color.surfaceElevated};
  --linear-border-muted: ${color.borderMuted};
  --linear-border-highlight: ${color.borderHighlight};
  --linear-text-primary: ${color.textPrimary};
  --linear-text-secondary: ${color.textSecondary};
  --linear-accent: ${color.accent};
  --linear-hairline: ${color.hairline};
  --linear-glass-tint: ${color.glassTint};
  --linear-glass-tint-soft: ${color.glassTintSoft};
  --linear-glass-fallback: ${color.glassFallback};
  --linear-accent-glow: ${color.accentGlow};
  --linear-overlay: ${color.overlay};
  --linear-shimmer-start: ${color.shimmerStart};
  --linear-shimmer-end: ${color.shimmerEnd};
  --linear-blur: ${blur.radius}px;
  --linear-radius-card: ${radius.card}px;
`.trim();

/**
 * Marketing-site CSS: custom properties, Tailwind v4 `@theme` aliases,
 * glassmorphic cards, and text shimmer. Generated from `tokens/index.ts`.
 */
export const linearCss = `
:root {
  ${cssVars}
  color-scheme: dark;
  background-color: var(--linear-substrate);
  color: var(--linear-text-primary);
}

@theme inline {
  --color-substrate: var(--linear-substrate);
  --color-obsidian: var(--linear-obsidian);
  --color-surface: var(--linear-surface);
  --color-elevated: var(--linear-elevated);
  --color-border-muted: var(--linear-border-muted);
  --color-border-highlight: var(--linear-border-highlight);
  --color-text-primary: var(--linear-text-primary);
  --color-text-secondary: var(--linear-text-secondary);
  --color-accent: var(--linear-accent);
}

html, body, #root {
  height: 100%;
  width: 100%;
  margin: 0;
  background-color: var(--linear-substrate);
  overflow: hidden;
}

.linear-glow-card {
  background: linear-gradient(135deg, var(--linear-glass-tint) 0%, var(--linear-glass-tint-soft) 100%);
  backdrop-filter: blur(var(--linear-blur));
  -webkit-backdrop-filter: blur(var(--linear-blur));
  border: 1px solid var(--linear-hairline);
  border-radius: var(--linear-radius-card);
  box-shadow: 0 4px 30px var(--linear-overlay);
}

.linear-text-shimmer {
  background: linear-gradient(180deg, var(--linear-shimmer-start) 0%, var(--linear-shimmer-end) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .linear-glow-card {
    background: var(--linear-glass-fallback);
  }
}
`;
