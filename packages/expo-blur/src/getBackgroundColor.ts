import { BlurTint } from './BlurView.types';

export default function getBackgroundColor(intensity: number, tint: BlurTint): string {
  const opacity = intensity / 100;
  switch (tint) {
    // From Apple iOS 14 Sketch Kit - https://developer.apple.com/design/resources/
    // From Apple iOS 14 Sketch Kit - https://developer.apple.com/design/resources/
    case 'dark':
    case 'systemMaterialDark':
      return `rgba(25,25,25,${opacity * 0.78})`;
    case 'light':
    case 'extraLight':
    case 'systemMaterialLight':
    case 'systemUltraThinMaterialLight':
    case 'systemThickMaterialLight':
      return `rgba(249,249,249,${opacity * 0.78})`;

    case 'default':
    case 'prominent':
    case 'systemMaterial':
      return `rgba(255,255,255,${opacity * 0.3})`;
    case 'regular':
      return `rgba(179,179,179,${opacity * 0.82})`;
    case 'systemThinMaterial':
      return `rgba(199,199,199,${opacity * 0.97})`;
    case 'systemChromeMaterial':
      return `rgba(255,255,255,${opacity * 0.75})`;
    case 'systemChromeMaterialLight':
      return `rgba(255,255,255,${opacity * 0.97})`;
    case 'systemUltraThinMaterial':
      return `rgba(191,191,191,${opacity * 0.44})`;
    case 'systemThickMaterial':
      return `rgba(191,191,191,${opacity * 0.44})`;
    case 'systemThickMaterialDark':
      return `rgba(37,37,37,${opacity * 0.9})`;
    case 'systemThinMaterialDark':
      return `rgba(37,37,37,${opacity * 0.7})`;
    case 'systemUltraThinMaterialDark':
      return `rgba(37,37,37,${opacity * 0.55})`;
    case 'systemChromeMaterialDark':
      return `rgba(0,0,0,${opacity * 0.75})`;
    case 'systemThinMaterialLight':
      return `rgba(199,199,199,${opacity * 0.78})`;
  }
}
