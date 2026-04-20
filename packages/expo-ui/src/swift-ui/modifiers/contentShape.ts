import { createModifier } from './createModifier';
import type { Shape } from './shapes/index';

/**
 * Defines the content shape for hit-testing purposes.
 *
 * This modifier is essential for making entire view areas (including `Spacer` or empty space)
 * interactive. Without it, only visible elements like `Text` or `Image` respond to tap gestures.
 *
 * @param shape - A shape configuration from the shapes API (rectangle, circle, capsule, ellipse, roundedRectangle).
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
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/contentshape(_:eofill:)).
 */
export const contentShape = (shape: Shape) => createModifier('contentShape', shape);
