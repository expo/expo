import { createModifier } from './createModifier';
import type { Color } from './types';

export type ContainerBackgroundPlacement = 'widget' | 'navigation' | 'navigationSplitView';

/**
 * Sets the container background of the enclosing container using a view.
 * @param color - The color to set as the background of the container.
 * @param container - The type of container to apply the background to.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/containerbackground(_:for:)).
 */
export const containerBackground = (color: Color, container: ContainerBackgroundPlacement) =>
  createModifier('containerBackground', { color, container });
