import React, { cloneElement, isValidElement, use, type ReactElement, type ReactNode } from 'react';
import type { SplitHostProps } from 'react-native-screens/experimental';

import Stack from '../layouts/StackClient';
import { IsWithinNativeNavigator } from '../standard-navigation';
import { ExpoUISplitView } from './ExpoUISplitView';
import { RNSSplitView } from './RNSSplitView';
import {
  SplitViewColumn,
  SplitViewInspector,
  type SplitViewColumnProps,
  type SplitViewInspectorProps,
} from './elements';
interface SplitViewCommonProps {
  children?: ReactNode;
  /**
   * Enables React Activity for screens rendered by the detail slot.
   * @default false
   */
  activityEnabled?: boolean;
  /**
   * Default options for routes rendered in the detail column.
   */
  screenOptions?: React.ComponentProps<typeof Stack>['screenOptions'];
}

interface ExpoUISplitViewColumnMetrics {
  minimumPrimaryColumnWidth?: number;
  preferredPrimaryColumnWidth?: number;
  maximumPrimaryColumnWidth?: number;
  minimumSupplementaryColumnWidth?: number;
  preferredSupplementaryColumnWidth?: number;
  maximumSupplementaryColumnWidth?: number;
}

export type ExpoUISplitViewHostProps = Pick<
  SplitHostProps,
  'ref' | 'topColumnForCollapsing' | 'preferredDisplayMode' | 'preferredSplitBehavior'
> & {
  columnMetrics?: ExpoUISplitViewColumnMetrics;
};

export type SplitViewProps =
  | (SplitViewCommonProps &
      Omit<SplitHostProps, 'children'> & {
        implementation?: 'rns';
      })
  | (SplitViewCommonProps &
      ExpoUISplitViewHostProps & {
        implementation: 'expo-ui';
      });

/**
 * Props shared by the native implementations of `SplitView`.
 */
export interface SplitViewImplementationProps extends Omit<SplitHostProps, 'children'> {
  columns: SplitViewColumnProps[];
  inspectors: SplitViewInspectorProps[];
  main: ReactElement;
}

function SplitViewNavigator(props: SplitViewProps) {
  const { children, activityEnabled, screenOptions, implementation = 'rns' } = props;
  // The SwiftUI split view is a plain view, so only the UIKit one conflicts with native navigators.
  if (implementation === 'rns' && use(IsWithinNativeNavigator)) {
    throw new Error('SplitView cannot be used inside another native navigator.');
  }

  const columns: SplitViewColumnProps[] = [];
  const inspectors: SplitViewInspectorProps[] = [];
  const screens: ReactElement<React.ComponentProps<typeof Stack.Screen>>[] = [];
  let hasUnknownChildren = false;
  for (const child of React.Children.toArray(children)) {
    if (!isValidElement(child)) {
      hasUnknownChildren = true;
    } else if (child.type === SplitViewColumn) {
      columns.push(child.props as SplitViewColumnProps);
    } else if (child.type === SplitViewInspector) {
      inspectors.push(child.props as SplitViewInspectorProps);
    } else if (child.type === Stack.Screen) {
      // The runtime type check above identifies the element as `Stack.Screen`.
      screens.push(child as ReactElement<React.ComponentProps<typeof Stack.Screen>>);
    } else {
      hasUnknownChildren = true;
    }
  }

  const stackScreens =
    implementation === 'expo-ui'
      ? screens.map((screen) => {
          const options = screen.props.options;
          return cloneElement(screen, {
            options:
              typeof options === 'function'
                ? (args: Parameters<typeof options>[0]) => ({
                    ...options(args),
                    headerShown: false,
                  })
                : { ...options, headerShown: false },
          });
        })
      : screens;
  const expoUIScreenOptions: React.ComponentProps<typeof Stack>['screenOptions'] =
    implementation === 'expo-ui'
      ? typeof screenOptions === 'function'
        ? (args) => ({
            ...screenOptions(args),
            headerShown: false,
          })
        : { ...screenOptions, headerShown: false }
      : screenOptions;
  const main = (
    <Stack activityEnabled={activityEnabled} screenOptions={expoUIScreenOptions}>
      {stackScreens}
    </Stack>
  );

  if (process.env.EXPO_OS !== 'ios') {
    console.warn(
      'SplitView is only supported on iOS. The SplitView will behave like a Stack navigator on other platforms.'
    );
    return main;
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
    return main;
  }

  if (implementation === 'expo-ui') {
    const {
      ref,
      topColumnForCollapsing,
      preferredDisplayMode,
      preferredSplitBehavior,
      columnMetrics,
    } = props;
    return (
      <ExpoUISplitView
        ref={ref}
        topColumnForCollapsing={topColumnForCollapsing}
        preferredDisplayMode={preferredDisplayMode}
        preferredSplitBehavior={preferredSplitBehavior}
        columnMetrics={columnMetrics}
        columns={columns}
        inspectors={inspectors}
        main={main}
      />
    );
  }

  const {
    children: _children,
    activityEnabled: _activityEnabled,
    screenOptions: _screenOptions,
    implementation: _implementation,
    ...hostProps
  } = props;
  return <RNSSplitView {...hostProps} columns={columns} inspectors={inspectors} main={main} />;
}

export const SplitView = Object.assign(SplitViewNavigator, {
  Column: SplitViewColumn,
  Inspector: SplitViewInspector,
  /** Configures a route rendered in the detail stack. Usable in the layout or inside a page. */
  Screen: Stack.Screen,
});
