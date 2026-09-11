import { requireNativeView } from 'expo';
import { type ComponentType, type ReactNode } from 'react';
import { type NativeSyntheticEvent } from 'react-native';

import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type NavigationSplitViewVisibility = 'automatic' | 'all' | 'doubleColumn' | 'detailOnly';
export type NavigationSplitViewColumn = 'sidebar' | 'content' | 'detail';

export interface NavigationSplitViewProps extends CommonViewModifierProps {
  /** The views displayed in the split view's columns. */
  children: ReactNode;
  /** The visible columns. Leave undefined to let the split view manage visibility. */
  columnVisibility?: NavigationSplitViewVisibility;
  /** The column shown on top when the split view collapses to a single column. */
  preferredCompactColumn?: NavigationSplitViewColumn;
  /** Called when the visible columns change. */
  onColumnVisibilityChange?: (columnVisibility: NavigationSplitViewVisibility) => void;
  /** Called when the preferred compact column changes. */
  onPreferredCompactColumnChange?: (preferredCompactColumn: NavigationSplitViewColumn) => void;
}

type NativeNavigationSplitViewProps = Omit<
  NavigationSplitViewProps,
  'onColumnVisibilityChange' | 'onPreferredCompactColumnChange'
> & {
  onColumnVisibilityChange?: (
    event: NativeSyntheticEvent<{ columnVisibility: NavigationSplitViewVisibility }>
  ) => void;
  onPreferredCompactColumnChange?: (
    event: NativeSyntheticEvent<{ preferredCompactColumn: NavigationSplitViewColumn }>
  ) => void;
};

const NavigationSplitViewNativeView: ComponentType<NativeNavigationSplitViewProps> =
  requireNativeView('ExpoUI', 'NavigationSplitViewView');

function Column({ name, children }: { name: NavigationSplitViewColumn; children: ReactNode }) {
  return <Slot name={name}>{children}</Slot>;
}

function Sidebar({ children }: { children: ReactNode }) {
  return <Column name="sidebar">{children}</Column>;
}

function Content({ children }: { children: ReactNode }) {
  return <Column name="content">{children}</Column>;
}

function Detail({ children }: { children: ReactNode }) {
  return <Column name="detail">{children}</Column>;
}

function NavigationSplitViewComponent({
  modifiers,
  onColumnVisibilityChange,
  onPreferredCompactColumnChange,
  ...props
}: NavigationSplitViewProps) {
  return (
    <NavigationSplitViewNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...props}
      onColumnVisibilityChange={
        onColumnVisibilityChange
          ? ({ nativeEvent }) => onColumnVisibilityChange(nativeEvent.columnVisibility)
          : undefined
      }
      onPreferredCompactColumnChange={
        onPreferredCompactColumnChange
          ? ({ nativeEvent }) => onPreferredCompactColumnChange(nativeEvent.preferredCompactColumn)
          : undefined
      }
    />
  );
}

/**
 * A SwiftUI `NavigationSplitView` with two or three columns.
 *
 * @platform ios 16.0+
 */
export const NavigationSplitView = Object.assign(NavigationSplitViewComponent, {
  Sidebar,
  Content,
  Detail,
});
