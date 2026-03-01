/**
 * Shape builders for modifiers that accept shapes, such as `background` and `containerShape`.
 *
 * Shapes: `roundedRectangle`, `capsule`, `rectangle`, `ellipse`, `circle`.
 *
 * @example
 * ```tsx
 * import { background, shapes } from '@expo/ui/swift-ui/modifiers';
 * import { Text, Host } from '@expo/ui/swift-ui';
 *
 * function Example() {
 *   return (
 *     <Host>
 *     <Text
 *       modifiers={[
 *         background('#000', shapes.roundedRectangle({ cornerRadius: 12 })),
 *       ]}
 *     >
 *       Hello, world!
 *     </Text>
 *   </Host>
 *   );
 * }
 * ```
 * @hideType
 */
export const shapes = {
  roundedRectangle: (params: {
    cornerRadius?: number;
    roundedCornerStyle?: 'continuous' | 'circular';
    cornerSize?: { width: number; height: number };
  }) => ({
    cornerRadius: params.cornerRadius,
    roundedCornerStyle: params.roundedCornerStyle,
    cornerSize: params.cornerSize,
    shape: 'roundedRectangle',
  }),
  capsule: (params?: { roundedCornerStyle?: 'continuous' | 'circular' }) => ({
    roundedCornerStyle: params?.roundedCornerStyle,
    shape: 'capsule',
  }),
  rectangle: () => ({
    shape: 'rectangle',
  }),
  ellipse: () => ({
    shape: 'ellipse',
  }),
  circle: () => ({
    shape: 'circle',
  }),
};

export type Shape =
  | ReturnType<typeof shapes.roundedRectangle>
  | ReturnType<typeof shapes.capsule>
  | ReturnType<typeof shapes.rectangle>
  | ReturnType<typeof shapes.ellipse>
  | ReturnType<typeof shapes.circle>;
