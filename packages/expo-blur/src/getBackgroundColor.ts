import { BlurTint } from './BlurView.types';

export default function getBackgroundColor(intensity: number, tint: BlurTint): string {
  const opacity = intensity / 100;
  switch (tint) {
    case 'dark':
      return `rgba(28,28,28,${opacity * 0.73})`;
    case 'light':
      return `rgba(247,247,247,${opacity * 0.8})`;
    case 'default':
      return `rgba(255,255,255,${opacity * 0.3})`;
  }
  throw new Error(`Unsupported tint provided: ${tint}`);
}
