import { requireNativeView } from 'expo';

import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface ToolbarProps extends CommonViewModifierProps {
  /**
   * The view the toolbar belongs to, together with the `Toolbar.Content` that fills it.
   */
  children: React.ReactNode;
}

export interface ToolbarContentProps {
  /**
   * The items to place in the toolbar.
   */
  children: React.ReactNode;
}

/**
 * Where an item sits in the toolbar. A placement the current platform or OS version does not
 * offer falls back to `automatic`.
 *
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/toolbaritemplacement).
 */
export type ToolbarItemPlacement =
  | 'automatic'
  | 'principal'
  | 'navigation'
  | 'primaryAction'
  | 'secondaryAction'
  | 'status'
  | 'confirmationAction'
  | 'cancellationAction'
  | 'destructiveAction'
  | 'keyboard'
  | 'topBarLeading'
  | 'topBarTrailing'
  | 'topBarPinnedTrailing'
  | 'largeTitle'
  | 'bottomBar';

/**
 * How readily a toolbar item gives up its place when the toolbar runs out of room.
 *
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/toolbaritemvisibilitypriority).
 */
export type ToolbarItemVisibilityPriority = 'automatic' | 'low' | 'high';

export interface ToolbarItemProps {
  /**
   * The semantic placement of the item within the toolbar.
   * @default 'automatic'
   */
  placement?: ToolbarItemPlacement;
  /**
   * How readily the item gives up its place. Items overflow lowest priority first. `low` and
   * `high` apply on iOS and macOS.
   * @default 'automatic'
   * @platform ios 27.0+
   */
  visibilityPriority?: ToolbarItemVisibilityPriority;
  /**
   * The content of the item.
   */
  children: React.ReactNode;
}

const ToolbarNativeView: React.ComponentType<ToolbarProps> = requireNativeView(
  'ExpoUI',
  'ToolbarView'
);

/**
 * The items placed in the toolbar of the view `Toolbar` wraps.
 */
function ToolbarContent(props: ToolbarContentProps) {
  return <Slot name="content">{props.children}</Slot>;
}

/**
 * A single item in a toolbar, matching SwiftUI's `ToolbarItem`. Place it inside `Toolbar.Content`
 * to control where the item appears.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Text>Bird description</Text>
 *   <Toolbar.Content>
 *     <ToolbarItem placement="topBarTrailing">
 *       <Button systemImage="square.and.arrow.up" onPress={share} />
 *     </ToolbarItem>
 *   </Toolbar.Content>
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
export function ToolbarItem({
  placement = 'automatic',
  visibilityPriority = 'automatic',
  children,
}: ToolbarItemProps) {
  return (
    <Slot name="item" extraProps={{ placement, visibilityPriority }}>
      {children}
    </Slot>
  );
}

/**
 * Adds a toolbar to the view it wraps, matching SwiftUI's `toolbar(content:)`.
 *
 * @example
 * ```tsx
 * <NavigationStack>
 *   <Toolbar>
 *     <Text>Bird description</Text>
 *     <Toolbar.Content>
 *       <Button role="close" onPress={() => setIsPresented(false)} />
 *     </Toolbar.Content>
 *   </Toolbar>
 * </NavigationStack>
 * ```
 *
 * @platform ios
 */
function ToolbarComponent(props: ToolbarProps) {
  const { modifiers, children, ...restProps } = props;
  return (
    <ToolbarNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {children}
    </ToolbarNativeView>
  );
}

const Toolbar = Object.assign(ToolbarComponent, { Content: ToolbarContent });

export { Toolbar };
