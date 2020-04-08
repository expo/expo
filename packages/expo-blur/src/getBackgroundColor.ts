import { BlurTint } from './BlurView.types';

export default function getBackgroundColor(intensity: number, tint: BlurTint): string {
  const opacity = intensity / 100;
  switch (tint) {
    case 'dark':
      // From apple.com
      return `rgba(28,28,28,${opacity * 0.65})`;
    case 'light':
      // From https://www.apple.com/newsroom
      return `rgba(255,255,255,${opacity * 0.7})`;
    case 'default':
      // From xcode composition
      return `rgba(255,255,255,${opacity * 0.3})`;
  }
  throw new Error(`Unsupported tint provided: ${tint}`);
}
