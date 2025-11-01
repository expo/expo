import { createModifier } from './createModifier';
import type { Shape } from './shapes/index';

/**
 * Sets the container shape for the view.
 * @param shape - A shape configuration from the shapes API
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/containershape(_:)).
 */
export const containerShape = (shape: Shape) => createModifier('containerShape', shape);
