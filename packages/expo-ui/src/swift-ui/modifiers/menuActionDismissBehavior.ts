import { createModifier } from './createModifier';

export type MenuActionDismissBehaviorType = 'automatic' | 'disabled' | 'enabled';

/**
 * Tells a menu whether to dismiss after performing an action.
 * @param behavior - The dismiss behavior for menu actions.
 * @platform ios 16.4+
 * @platform tvos 16.4+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/menuactiondismissbehavior(_:)).
 */
export const menuActionDismissBehavior = (behavior: MenuActionDismissBehaviorType) =>
  createModifier('menuActionDismissBehavior', { behavior });
