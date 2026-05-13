import { createModifier } from './createModifier';

/**
 * Sets a tag on a view.
 * @param tag - The tag to set on the view.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/tag(_:includeoptional:)).
 */
export const tag = (tag: string | number) => createModifier('tag', { tag });
