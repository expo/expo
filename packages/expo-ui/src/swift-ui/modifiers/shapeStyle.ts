import type { Color } from './types';

/**
 * A style that paints an area, mirroring SwiftUI's `ShapeStyle`.
 * A bare color is a shorthand for `{ type: 'color', color }`.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/shapestyle).
 */
export type ShapeStyle =
  | Color // Simple color (hex string, color name, or React Native ColorValue)
  | { type: 'color'; color: Color }
  | {
      type: 'hierarchical';
      style: 'primary' | 'secondary' | 'tertiary' | 'quaternary' | 'quinary';
    }
  | {
      /**
       * A blurred backdrop that samples the content behind the view and adapts to the current
       * color scheme. `'bar'` has no tvOS counterpart and is ignored there.
       */
      type: 'material';
      material: 'ultraThin' | 'thin' | 'regular' | 'thick' | 'ultraThick' | 'bar';
    }
  | {
      type: 'linearGradient';
      colors: Color[];
      startPoint: { x: number; y: number };
      endPoint: { x: number; y: number };
    }
  | {
      type: 'radialGradient';
      colors: Color[];
      center: { x: number; y: number };
      startRadius: number;
      endRadius: number;
    }
  | {
      type: 'angularGradient';
      colors: Color[];
      center: { x: number; y: number };
    };

/**
 * Normalizes a style into the shape the native side reads. A `Color` may itself be an object
 * (for example the one returned by `PlatformColor`), so a style is only treated as a tagged
 * variant when it carries a `type` field.
 */
export function resolveShapeStyle(style: ShapeStyle): Record<string, any> {
  if (style == null || typeof style !== 'object' || !('type' in style)) {
    return { type: 'color', color: style };
  }
  if (style.type === 'hierarchical') {
    return { type: 'hierarchical', hierarchical: style.style };
  }
  return { ...style };
}
