import { createModifier, type ModifierConfig } from './createModifier';
import { resolveShapeStyle, type ShapeStyle } from './shapeStyle';
import type { Shape } from './shapes/index';

export type BackgroundOptions = {
  /**
   * The safe area edges the background extends into.
   * @default 'all'
   */
  ignoresSafeAreaEdges?:
    | 'all'
    | 'top'
    | 'bottom'
    | 'leading'
    | 'trailing'
    | 'horizontal'
    | 'vertical';
};

/**
 * Sets the background of a view.
 *
 * Two variants matching SwiftUI:
 * - `background(style)` — paints the whole view, expanding into the safe area unless
 *   `ignoresSafeAreaEdges` narrows it down
 * - `background(style, shapes.capsule())` — paints the given shape
 *
 * To draw an arbitrary view behind another one, use the `Background` component instead.
 *
 * @example
 * ```tsx
 * <Text modifiers={[background('#FF0000')]}>Solid color</Text>
 * <Text modifiers={[background({ type: 'material', material: 'thin' })]}>Blurred backdrop</Text>
 * <Text modifiers={[background('#FF0000', shapes.roundedRectangle({ cornerRadius: 12 }))]}>
 *   Rounded
 * </Text>
 * ```
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/background(_:ignoressafeareaedges:)).
 */
export function background(style: ShapeStyle, options?: BackgroundOptions): ModifierConfig;
export function background(style: ShapeStyle, shape?: Shape): ModifierConfig;
export function background(
  style: ShapeStyle,
  shapeOrOptions?: Shape | BackgroundOptions
): ModifierConfig {
  return createModifier('background', {
    style: resolveShapeStyle(style),
    ...shapeOrOptions,
  });
}
