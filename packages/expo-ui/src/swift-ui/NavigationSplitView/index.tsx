import { requireNativeView } from 'expo';

import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type NavigationSplitViewVisibility = 'automatic' | 'all' | 'doubleColumn' | 'detailOnly';

/**
 * The column shown when the split view collapses into a single column.
 */
export type NavigationSplitViewColumn = 'sidebar' | 'content' | 'detail';

export interface NavigationSplitViewProps extends CommonViewModifierProps {
  /**
   * The columns of the split view. Provide `NavigationSplitView.Sidebar` and
   * `NavigationSplitView.Detail`, and add `NavigationSplitView.Content` for a
   * three-column layout.
   */
  children: React.ReactNode;
  /**
   * The columns to show. Setting it makes the value controlled: pass the value from
   * `onColumnVisibilityChange` back in, otherwise dragging the divider has no effect.
   * Leave it unset to let the split view manage its own columns.
   * @default 'automatic'
   */
  columnVisibility?: NavigationSplitViewVisibility;
  /**
   * Called when the visible columns change, including when the user drags the sidebar.
   */
  onColumnVisibilityChange?: (visibility: NavigationSplitViewVisibility) => void;
  /**
   * The column to show when the split view collapses to a single column, for example
   * in a narrow window. Setting it makes the value controlled in the same way as
   * `columnVisibility`.
   * @default 'sidebar'
   * @platform ios 17.0+
   */
  preferredCompactColumn?: NavigationSplitViewColumn;
  /**
   * Called when the collapsed column changes.
   * @platform ios 17.0+
   */
  onPreferredCompactColumnChange?: (column: NavigationSplitViewColumn) => void;
}

type NativeNavigationSplitViewProps = Omit<
  NavigationSplitViewProps,
  'onColumnVisibilityChange' | 'onPreferredCompactColumnChange'
> & {
  onColumnVisibilityChange?: (event: {
    nativeEvent: { visibility: NavigationSplitViewVisibility };
  }) => void;
  onPreferredCompactColumnChange?: (event: {
    nativeEvent: { column: NavigationSplitViewColumn };
  }) => void;
};

const NavigationSplitViewNativeView: React.ComponentType<NativeNavigationSplitViewProps> =
  requireNativeView('ExpoUI', 'NavigationSplitViewView');

function NavigationSplitViewSidebar(props: { children: React.ReactNode }) {
  return <Slot name="sidebar">{props.children}</Slot>;
}

function NavigationSplitViewContent(props: { children: React.ReactNode }) {
  return <Slot name="content">{props.children}</Slot>;
}

function NavigationSplitViewDetail(props: { children: React.ReactNode }) {
  return <Slot name="detail">{props.children}</Slot>;
}

NavigationSplitView.Sidebar = NavigationSplitViewSidebar;
NavigationSplitView.Content = NavigationSplitViewContent;
NavigationSplitView.Detail = NavigationSplitViewDetail;

/**
 * NavigationSplitView uses the native [NavigationSplitView](https://developer.apple.com/documentation/swiftui/navigationsplitview) view.
 *
 * It presents a collection, a selection and a detail in one hierarchy: side by side
 * when there is room, and stacked when there is not.
 * @example
 * ```tsx
 * <Host style={{ flex: 1 }}>
 *   <NavigationSplitView>
 *     <NavigationSplitView.Sidebar>
 *       <List>{items}</List>
 *     </NavigationSplitView.Sidebar>
 *     <NavigationSplitView.Detail>
 *       <ItemDetail item={selectedItem} />
 *     </NavigationSplitView.Detail>
 *   </NavigationSplitView>
 * </Host>
 * ```
 * @platform ios 16.0+
 * @platform tvos 16.0+
 */
export function NavigationSplitView(props: NavigationSplitViewProps) {
  const {
    modifiers,
    children,
    onColumnVisibilityChange,
    onPreferredCompactColumnChange,
    ...restProps
  } = props;

  return (
    <NavigationSplitViewNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      onColumnVisibilityChange={({ nativeEvent: { visibility } }) =>
        onColumnVisibilityChange?.(visibility)
      }
      onPreferredCompactColumnChange={({ nativeEvent: { column } }) =>
        onPreferredCompactColumnChange?.(column)
      }
      {...restProps}>
      {children}
    </NavigationSplitViewNativeView>
  );
}
