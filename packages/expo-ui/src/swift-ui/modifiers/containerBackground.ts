import { createModifier } from './createModifier';
import { resolveShapeStyle, type ShapeStyle } from './shapeStyle';

export type ContainerBackgroundPlacement = 'widget' | 'navigation' | 'navigationSplitView';

/**
 * Sets the container background of the enclosing container.
 *
 * > **Note:** `navigation` and `navigationSplitView` require iOS 18. On iOS 17 they fall back to
 * > the `widget` placement.
 *
 * @param style - Any [`ShapeStyle`](#shapestyle): a color, a hierarchical style, a material, or a gradient.
 * @param container - The type of container to apply the background to.
 * @platform ios 17.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/containerbackground(_:for:)).
 */
export const containerBackground = (style: ShapeStyle, container: ContainerBackgroundPlacement) =>
  createModifier('containerBackground', { style: resolveShapeStyle(style), container });
