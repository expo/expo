import type { UsePreventZoomTransitionDismissalOptions } from './usePreventZoomTransitionDismissal.types';
/**
 * Limits the screen area where interactive dismissal gestures are allowed for zoom transitions.
 *
 * This hook must be called from the destination screen of a zoom transition (the screen you navigate to, not the source).
 * It restricts where app users can start swipe gestures to dismiss the screen and return to the previous screen.
 *
 * When a dismissal gesture starts inside the bounds, the screen can be dismissed. When a dismissal gesture starts outside
 * the bounds, dismissal is blocked completely. Undefined coordinates place no restriction on that dimension.
 *
 * > **Note**: Only one instance of this hook should be used per screen. If multiple instances exist, the last one to render will take effect.
 *
 * @example
 * ```tsx
 * // In your destination screen (e.g., app/image.tsx)
 * import { usePreventZoomTransitionDismissal } from 'expo-router';
 * import { useWindowDimensions } from 'react-native';
 * import { Image } from 'expo-image';
 *
 * export default function ImageScreen() {
 *   const dimensions = useWindowDimensions();
 *   // Only allow dismissal from the bottom 200px of the screen
 *   usePreventZoomTransitionDismissal({
 *     unstable_dismissalBoundsRect: {
 *       minY: dimensions.height - 200
 *     }
 *   });
 *
 *   return <Image source={...} style={{ flex: 1 }} />;
 * }
 * ```
 *
 * @platform ios
 */
export declare function usePreventZoomTransitionDismissal(_options?: UsePreventZoomTransitionDismissalOptions): void;
//# sourceMappingURL=usePreventZoomTransitionDismissal.d.ts.map