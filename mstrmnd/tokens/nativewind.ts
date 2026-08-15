/**
 * Tailwind v4 / NativeWind wiring for the shared Linear tokens.
 *
 * Expo + NativeWind:
 *   1. `npx expo install nativewind tailwindcss`
 *   2. Point `tailwind.config.js` at this preset (see below)
 *   3. Import `../styles/linear.css` from `app/_layout.tsx`
 *
 * tailwind.config.js
 * ```
 * const { tailwindThemeExtend } = require('./tokens');
 * module.exports = {
 *   content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
 *   presets: [require('nativewind/preset')],
 *   theme: { extend: tailwindThemeExtend },
 * };
 * ```
 *
 * Tailwind v4 CSS-first (marketing site):
 * ```
 * @import "tailwindcss";
 * @import "./styles/linear.css";
 * ```
 * Color utilities then resolve as `bg-substrate`, `text-accent`, `border-border-muted`.
 */
export { color, tailwindThemeExtend, tokens } from './index';
