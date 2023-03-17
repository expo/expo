import { BlurTint } from './BlurView.types';

export default function getBackgroundColor(intensity: number, tint: BlurTint): string {
  const opacity = intensity / 100;
  switch (tint) {
    case 'dark':
      // From Apple iOS 14 Sketch Kit - https://developer.apple.com/design/resources/
      return `rgba(25,25,25,${opacity * 0.78})`;
    case 'light':
      // From Apple iOS 14 Sketch Kit - https://developer.apple.com/design/resources/
      return `rgba(249,249,249,${opacity * 0.78})`;
    case 'default':
      // From xcode composition
      return `rgba(255,255,255,${opacity * 0.3})`;
  }
  throw new Error(`Unsupported tint provided: ${tint}`);
}

// Converts tint String to ColorInt in AARRGGBB format which is the closest to matching iOS tint
export function getAndroidTintColor(intensity: number, tint: BlurTint): number {
  const opacity = intensity / 100;
  switch (tint) {
    case 'dark':
      return ((255 * opacity * 0.69) << 24) + (25 << 16) + (25 << 8) + 25;
    case 'light':
      return ((255 * opacity * 0.78) << 24) + (249 << 16) + (249 << 8) + 249;
    case 'default':
      return ((255 * opacity * 0.3) << 24) + (255 << 16) + (255 << 8) + 255;
  }
  throw new Error(`Unsupported tint provided: ${tint}`);
}
