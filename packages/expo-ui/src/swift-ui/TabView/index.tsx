import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

/**
 * Identifies a tab.
 *
 * - Pager style (plain children): a numeric **index** (0, 1, 2, ...).
 * - Tab bar / sidebar styles (`<Tab>` children): the `value` prop of the selected tab.
 */
export type TabSelection = number | string;

export type TabViewProps<S extends TabSelection = TabSelection> = {
  /**
   * The selected tab (controlled mode). Pair with `onSelectionChange`.
   * Pass `defaultSelection` instead to let the native view manage state.
   */
  selection?: S;
  /**
   * The initially selected tab when the component is uncontrolled
   * (no `selection` prop). Ignored if `selection` is provided.
   */
  defaultSelection?: S;
  /**
   * Called when the selected tab changes.
   */
  onSelectionChange?: (selection: S) => void;
  /**
   * The pages to display. Use `<Tab>` children for labeled tabs, or plain
   * children with `tabViewStyle({ type: 'page' })` for a swipeable pager.
   */
  children: React.ReactElement | React.ReactElement[];
} & CommonViewModifierProps;

type NativeTabViewProps = Omit<TabViewProps, 'onSelectionChange'> &
  ViewEvent<'onSelectionChange', { selection: TabSelection }>;

const TabViewNativeView: React.ComponentType<NativeTabViewProps> = requireNativeView(
  'ExpoUI',
  'TabView'
);

/**
 * A SwiftUI `TabView`. Pair with modifiers to choose the appearance:
 *
 * - `tabViewStyle({ type: 'page' })` — swipeable pager.
 * - `tabViewStyle({ type: 'automatic' })` — bottom tab bar.
 * - `tabViewStyle({ type: 'sidebarAdaptable' })` — sidebar on iPad, tab bar on iPhone.
 *
 * Use `<Tab>` children for labeled tabs with value-based selection, or plain
 * children for a simple pager with index-based selection.
 *
 * For routed bottom-tab navigation across full-screen routes, prefer
 * `expo-router/unstable-native-tabs`.
 *
 * @platform ios
 */
export function TabView<S extends TabSelection>(props: TabViewProps<S>) {
  const { modifiers, onSelectionChange, ...restProps } = props;
  return (
    <TabViewNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onSelectionChange={
        onSelectionChange
          ? ({ nativeEvent: { selection } }) => onSelectionChange(selection as S)
          : undefined
      }
    />
  );
}

export { Tab, type TabProps } from './Tab';
