'use client';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack as ScreensStackV5 } from 'react-native-screens/experimental';

import type {
  ExperimentalStackDescriptor,
  ExperimentalStackDescriptorMap,
  ExperimentalStackNavigationHelpers,
  ExperimentalStackNavigationOptions,
} from './types';
import {
  type ParamListBase,
  type RouteProp,
  StackActions,
  type StackNavigationState,
  usePreventRemoveContext,
} from '../../react-navigation/native';
import { useDismissedRouteError } from '../../react-navigation/native-stack/utils/useDismissedRouteError';

const SUPPORTED_OPTION_KEYS = new Set<keyof ExperimentalStackNavigationOptions>([
  'title',
  'headerShown',
  'headerTransparent',
  'headerBackVisible',
]);

type Props = {
  state: StackNavigationState<ParamListBase>;
  navigation: ExperimentalStackNavigationHelpers;
  descriptors: ExperimentalStackDescriptorMap;
  describe: (route: RouteProp<ParamListBase>, placeholder: boolean) => ExperimentalStackDescriptor;
};

export function ExperimentalStackView({ state, navigation, descriptors, describe }: Props) {
  const { setNextDismissedKey } = useDismissedRouteError(state);
  const { preventedRoutes } = usePreventRemoveContext();

  const preloadedDescriptors = state.preloadedRoutes.reduce<ExperimentalStackDescriptorMap>(
    (acc, route) => {
      acc[route.key] = acc[route.key] || describe(route, true);
      return acc;
    },
    {}
  );

  return (
    <View style={styles.container}>
      <ScreensStackV5.Host>
        {state.routes.concat(state.preloadedRoutes).map((route) => {
          const descriptor = (descriptors[route.key] ?? preloadedDescriptors[route.key])!;
          const isPreloaded =
            preloadedDescriptors[route.key] !== undefined && descriptors[route.key] === undefined;
          const options = (descriptor.options ?? {}) as ExperimentalStackNavigationOptions;

          return (
            <ScreenView
              key={route.key}
              routeKey={route.key}
              descriptor={descriptor}
              options={options}
              isPreloaded={isPreloaded}
              preventNativeDismiss={preventedRoutes[route.key]?.preventRemove ?? false}
              onWillAppear={() => {
                navigation.emit({
                  type: 'transitionStart',
                  data: { closing: false },
                  target: route.key,
                });
              }}
              onWillDisappear={() => {
                navigation.emit({
                  type: 'transitionStart',
                  data: { closing: true },
                  target: route.key,
                });
              }}
              onDidAppear={() => {
                navigation.emit({
                  type: 'transitionEnd',
                  data: { closing: false },
                  target: route.key,
                });
              }}
              onDidDisappear={() => {
                navigation.emit({
                  type: 'transitionEnd',
                  data: { closing: true },
                  target: route.key,
                });
              }}
              onNativeDismiss={() => {
                // Native dismissal (e.g. swipe-to-dismiss). JS state still has the route —
                // catch up by dispatching pop and arming useDismissedRouteError so a stuck
                // beforeRemove listener surfaces an actionable console.error.
                navigation.dispatch({
                  ...StackActions.pop(),
                  source: route.key,
                  target: state.key,
                });
                setNextDismissedKey(route.key);
              }}
              onNativeDismissPrevented={() => {
                navigation.emit({
                  type: 'gestureCancel',
                  data: undefined,
                  target: route.key,
                });
              }}
            />
          );
        })}
      </ScreensStackV5.Host>
    </View>
  );
}

type ScreenViewProps = {
  routeKey: string;
  descriptor: ExperimentalStackDescriptor;
  options: ExperimentalStackNavigationOptions;
  isPreloaded: boolean;
  preventNativeDismiss: boolean;
  onWillAppear: () => void;
  onWillDisappear: () => void;
  onDidAppear: () => void;
  onDidDisappear: () => void;
  onNativeDismiss: (screenKey: string) => void;
  onNativeDismissPrevented: () => void;
};

function ScreenView({
  routeKey,
  descriptor,
  options,
  isPreloaded,
  preventNativeDismiss,
  ...lifecycle
}: ScreenViewProps) {
  useUnsupportedOptionsWarning(options, descriptor.route.name);

  const headerConfigProps = {
    title: options.title,
    hidden: options.headerShown === undefined ? undefined : !options.headerShown,
    transparent: options.headerTransparent,
    backButtonHidden:
      options.headerBackVisible === undefined ? undefined : !options.headerBackVisible,
  };

  return (
    <ScreensStackV5.Screen
      activityMode={isPreloaded ? 'detached' : 'attached'}
      screenKey={routeKey}
      preventNativeDismiss={preventNativeDismiss}
      {...lifecycle}>
      <View style={styles.scene}>{descriptor.render()}</View>
      <ScreensStackV5.HeaderConfig {...headerConfigProps} />
    </ScreensStackV5.Screen>
  );
}

// Composition components like <Stack.Screen.Title> and <Stack.Header> emit benign
// extras such as `headerTitleStyle: {}`, `headerLargeTitle: undefined`, or
// `headerStyle: { backgroundColor: undefined }` even when the user supplied no
// value. Treat any plain object whose enumerable values are all themselves no-op
// as no-op too, so the unsupported-option warning fires only on values that would
// actually have an effect under <Stack />.
function isNoOpOptionValue(value: unknown): boolean {
  if (value === undefined) return true;
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  for (const key in record) {
    if (!isNoOpOptionValue(record[key])) return false;
  }
  return true;
}

function useUnsupportedOptionsWarning(
  options: ExperimentalStackNavigationOptions,
  routeName: string
) {
  const warnedRef = React.useRef(false);
  React.useEffect(() => {
    if (!__DEV__ || warnedRef.current) return;
    const optionsRecord = options as Record<string, unknown>;
    const unsupported = Object.keys(options).filter(
      (key) =>
        !SUPPORTED_OPTION_KEYS.has(key as keyof ExperimentalStackNavigationOptions) &&
        !isNoOpOptionValue(optionsRecord[key])
    );
    if (unsupported.length === 0) return;
    warnedRef.current = true;
    console.warn(
      `ExperimentalStack: ignoring unsupported screenOption${unsupported.length > 1 ? 's' : ''} ${unsupported
        .map((key) => `'${key}'`)
        .join(', ')} on route '${routeName}'. ` +
        `The new react-native-screens experimental Stack only supports 'title', 'headerShown', 'headerTransparent', and 'headerBackVisible'. ` +
        `Custom headers, presentation, animation, sheets, and status bar options are not yet available — keep using <Stack /> for those screens.`
    );
  }, [options, routeName]);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scene: {
    flex: 1,
    backgroundColor: 'white',
  },
});
