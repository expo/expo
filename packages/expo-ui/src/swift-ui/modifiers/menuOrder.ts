import { createModifier } from './createModifier';

export type MenuOrderType = 'automatic' | 'fixed' | 'priority';

/**
 * Sets the preferred order of items for menus presented from this view.
 * With the default `automatic` order, a menu that opens upward displays its items
 * in reverse. Pass `fixed` to always keep the order the items were provided in.
 * @param order - The preferred menu item ordering.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/menuorder(_:)).
 */
export const menuOrder = (order: MenuOrderType) => createModifier('menuOrder', { order });
