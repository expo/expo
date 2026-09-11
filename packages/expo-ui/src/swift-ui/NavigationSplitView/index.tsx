import { requireNativeView } from 'expo';
import { type ReactNode } from 'react';
import { type NativeSyntheticEvent } from 'react-native';

import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type NavigationSplitViewVisibility = 'automatic' | 'all' | 'doubleColumn' | 'detailOnly';
export type NavigationSplitViewColumn = 'sidebar' | 'content' | 'detail';

export interface NavigationSplitViewProps extends CommonViewModifierProps {
  /** The view displayed in the leading column. */
  sidebar: ReactNode;
  /** The view displayed in the middle column of a three-column split view. */
  content?: ReactNode;
  /** The view displayed in the trailing column. */
  children: ReactNode;
  /** The visible columns in the split view. */
  columnVisibility?: NavigationSplitViewVisibility;
  /** Called when the visible columns change. */
  onColumnVisibilityChange?: (columnVisibility: NavigationSplitViewVisibility) => void;
  /**
   * The column displayed when the split view collapses to a single column.
   * @platform ios 17.0+
   */
  preferredCompactColumn?: NavigationSplitViewColumn;
  /**
   * Called when the preferred compact column changes.
   * @platform ios 17.0+
   */
  onPreferredCompactColumnChange?: (preferredCompactColumn: NavigationSplitViewColumn) => void;
}

type NativeNavigationSplitViewProps = Omit<
  NavigationSplitViewProps,
  'sidebar' | 'content' | 'onColumnVisibilityChange' | 'onPreferredCompactColumnChange'
> & {
  hasColumnVisibilityBinding: boolean;
  hasPreferredCompactColumnBinding: boolean;
  onColumnVisibilityChange?: (
    event: NativeSyntheticEvent<{ columnVisibility: NavigationSplitViewVisibility }>
  ) => void;
  onPreferredCompactColumnChange?: (
    event: NativeSyntheticEvent<{ preferredCompactColumn: NavigationSplitViewColumn }>
  ) => void;
};

const NavigationSplitViewNativeView = requireNativeView<NativeNavigationSplitViewProps>(
  'ExpoUI',
  'NavigationSplitView'
);

/**
 * A view that presents two or three columns whose visibility adapts to the available width.
 *
 * @platform ios
 */
export function NavigationSplitView(props: NavigationSplitViewProps) {
  const {
    sidebar,
    content,
    children,
    modifiers,
    columnVisibility,
    preferredCompactColumn,
    onColumnVisibilityChange,
    onPreferredCompactColumnChange,
    ...restProps
  } = props;
  return (
    <NavigationSplitViewNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      columnVisibility={columnVisibility}
      preferredCompactColumn={preferredCompactColumn}
      hasColumnVisibilityBinding={columnVisibility != null || onColumnVisibilityChange != null}
      hasPreferredCompactColumnBinding={
        preferredCompactColumn != null || onPreferredCompactColumnChange != null
      }
      onColumnVisibilityChange={
        onColumnVisibilityChange
          ? ({ nativeEvent: { columnVisibility } }) => onColumnVisibilityChange(columnVisibility)
          : undefined
      }
      onPreferredCompactColumnChange={
        onPreferredCompactColumnChange
          ? ({ nativeEvent: { preferredCompactColumn } }) =>
              onPreferredCompactColumnChange(preferredCompactColumn)
          : undefined
      }>
      <Slot name="sidebar">{sidebar}</Slot>
      {content != null ? <Slot name="content">{content}</Slot> : null}
      <Slot name="detail">{children}</Slot>
    </NavigationSplitViewNativeView>
  );
}
