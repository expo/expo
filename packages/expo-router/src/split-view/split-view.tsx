import React, { isValidElement, use, type ReactElement, type ReactNode } from 'react';
import type { SplitHostProps } from 'react-native-screens/experimental';

import { IsWithinNativeNavigator } from '../standard-navigation';
import type { ScreenProps } from '../useScreens';
import { RouterSlot } from '../views/Navigator';
import { Screen } from '../views/Screen';
import { ExpoUISplitView } from './ExpoUISplitView';
import { RNSSplitView } from './RNSSplitView';
import {
  SplitViewColumn,
  SplitViewInspector,
  type SplitViewColumnProps,
  type SplitViewInspectorProps,
  type SplitViewScreenOptions,
} from './elements';
import { getSplitViewImplementation } from './implementation';

/**
 * For full list of supported props, see [`SplitHostProps`](http://github.com/software-mansion/react-native-screens/blob/main/src/components/gamma/split/SplitHost.types.ts#L117)
 */
export interface SplitViewProps extends Omit<SplitHostProps, 'children'> {
  children?: ReactNode;
  /**
   * Enables React Activity for screens rendered by the detail slot.
   * @default false
   */
  activityEnabled?: boolean;
  /**
   * Default options for routes rendered in the detail column.
   */
  screenOptions?: SplitViewScreenOptions;
}

/**
 * Props shared by the native implementations of `SplitView`.
 */
export interface SplitViewImplementationProps extends Omit<SplitHostProps, 'children'> {
  columns: SplitViewColumnProps[];
  inspectors: SplitViewInspectorProps[];
  /** `SplitView.Screen` elements, passed to the detail navigator. */
  screens: ReactElement[];
  activityEnabled?: boolean;
  screenOptions?: SplitViewScreenOptions;
}

function SplitViewNavigator({
  children,
  activityEnabled,
  screenOptions,
  ...hostProps
}: SplitViewProps) {
  // The SwiftUI split view is a plain view, so only the UIKit one conflicts with native navigators.
  const implementation = getSplitViewImplementation();
  if (implementation === 'rns' && use(IsWithinNativeNavigator)) {
    throw new Error('SplitView cannot be used inside another native navigator.');
  }

  const columns: SplitViewColumnProps[] = [];
  const inspectors: SplitViewInspectorProps[] = [];
  const screens: ReactElement[] = [];
  let hasUnknownChildren = false;
  for (const child of React.Children.toArray(children)) {
    if (!isValidElement(child)) {
      hasUnknownChildren = true;
    } else if (child.type === SplitViewColumn) {
      columns.push(child.props as SplitViewColumnProps);
    } else if (child.type === SplitViewInspector) {
      inspectors.push(child.props as SplitViewInspectorProps);
    } else if (child.type === Screen) {
      screens.push(child);
    } else {
      hasUnknownChildren = true;
    }
  }

  const detail = (
    <RouterSlot activityEnabled={activityEnabled} screenOptions={screenOptions}>
      {screens}
    </RouterSlot>
  );

  if (process.env.EXPO_OS !== 'ios') {
    console.warn(
      'SplitView is only supported on iOS. The SplitView will behave like a Slot navigator on other platforms.'
    );
    return detail;
  }

  if (hasUnknownChildren) {
    console.warn(
      'Only SplitView.Column, SplitView.Inspector and SplitView.Screen components are allowed as direct children of SplitView.'
    );
  }

  if (columns.length > 2) {
    throw new Error('There can only be two SplitView.Column in the SplitView.');
  }

  if (columns.length + inspectors.length === 0) {
    console.warn('No SplitView.Column and SplitView.Inspector found in SplitView.');
    return detail;
  }

  const Implementation = implementation === 'expo-ui' ? ExpoUISplitView : RNSSplitView;
  return (
    <Implementation
      {...hostProps}
      columns={columns}
      inspectors={inspectors}
      screens={screens}
      activityEnabled={activityEnabled}
      screenOptions={screenOptions}
    />
  );
}

export const SplitView = Object.assign(SplitViewNavigator, {
  Column: SplitViewColumn,
  Inspector: SplitViewInspector,
  /** Configures a route rendered in the detail column. Usable in the layout or inside a page. */
  // `Screen` is generic over its options, so this narrows it to the detail column options.
  Screen: Screen as (props: ScreenProps<SplitViewScreenOptions>) => null,
});
