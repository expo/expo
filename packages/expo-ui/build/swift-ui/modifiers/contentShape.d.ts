import type { Shape } from './shapes/index';
/**
 * The kinds of interaction a content shape applies to.
 *
 * - `interaction` - The kind for hit-testing and accessibility.
 * - `dragPreview` - The kind for drag and drop previews.
 * - `contextMenuPreview` - The kind for context menu previews.
 * - `hoverEffect` - The kind for hover effects.
 * - `accessibility` - The kind for accessibility.
 */
export type ContentShapeKind = 'interaction' | 'dragPreview' | 'contextMenuPreview' | 'hoverEffect' | 'accessibility';
/**
 * Defines the content shape for hit-testing purposes.
 *
 * This modifier is essential for making entire view areas (including `Spacer` or empty space)
 * interactive. Without it, only visible elements like `Text` or `Image` respond to tap gestures.
 *
 * Pass `kind` to shape something other than the default `interaction` (hit-testing), such as
 * the preview used while a `List.ForEach` row is dragged to reorder it.
 *
 * @param shape - A shape configuration from the shapes API (rectangle, circle, capsule, ellipse, roundedRectangle).
 * @param kind - The kinds to apply the shape to. Defaults to `interaction` when not provided.
 *
 * @example
 * ```tsx
 * import { HStack, List, Section, Spacer, Text } from "@expo/ui/swift-ui";
 * import { contentShape, onTapGesture } from "@expo/ui/swift-ui/modifiers";
 * import { shapes } from "@expo/ui/swift-ui/modifiers";
 *
 * function InteractiveRow() {
 *   return (
 *     <List>
 *       <Section title="Settings">
 *         <HStack
 *           modifiers={[
 *             contentShape(shapes.rectangle()),
 *             onTapGesture(() => console.log("Row tapped!"))
 *           ]}
 *         >
 *           <Text>Label</Text>
 *           <Spacer />
 *           <Text>Value</Text>
 *         </HStack>
 *       </Section>
 *     </List>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Round the preview shown while a row is dragged, so its corners are not filled in.
 * <Label
 *   title={item.title}
 *   modifiers={[contentShape(shapes.roundedRectangle({ cornerRadius: 10 }), 'dragPreview')]}
 * />
 * ```
 *
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/contentshape(_:_:eofill:)).
 */
export declare const contentShape: (shape: Shape, kind?: ContentShapeKind | ContentShapeKind[]) => import("./createModifier").ModifierConfig;
//# sourceMappingURL=contentShape.d.ts.map