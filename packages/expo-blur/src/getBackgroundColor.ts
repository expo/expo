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
