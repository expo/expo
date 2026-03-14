import { SafeAreaProviderCompat } from '@react-navigation/elements';
import { NavigationContext, NavigationRouteContext, StackActions } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { Stack } from 'react-native-screens/experimental';

import type { NativeStackOptions } from './types';
import type { NativeStackState } from './NativeStackRouter';

type Descriptor = {
  options: NativeStackOptions;
  render: () => React.ReactNode;
  route: { key: string; name: string };
  navigation: any;
};

type Props = {
  state: NativeStackState;
  navigation: any;
  descriptors: Record<string, Descriptor>;
};

export function NativeStackView({ state, navigation, descriptors }: Props) {
  const cachedDescriptors = useMemo(() => new Map(), []);
  return (
    <SafeAreaProviderCompat>
      <Stack.Host>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key] ?? cachedDescriptors.get(route.key);

          if (!descriptor) {
            throw new Error(`Descriptor not found for route ${route.name} ${route.key}`);
          }

          return (
            <NavigationContext.Provider key={route.key} value={descriptor.navigation}>
              <NavigationRouteContext.Provider value={route}>
                <Stack.Screen
                  key={route.key}
                  screenKey={route.key}
                  activityMode={!state.poppedRoutes.has(route.key) ? 'attached' : 'detached'}
                  // Event callbacks
                  onWillAppear={() => {
                    console.log('onWillAppear');
                    navigation.emit({
                      type: 'transitionStart',
                      data: { closing: false },
                      target: route.key,
                    });
                  }}
                  onDidAppear={() => {
                    console.log('onDidAppear');
                    navigation.emit({
                      type: 'transitionEnd',
                      data: { closing: false },
                      target: route.key,
                    });
                  }}
                  onWillDisappear={() => {
                    console.log('onWillDisappear');
                    navigation.emit({
                      type: 'transitionStart',
                      data: { closing: true },
                      target: route.key,
                    });
                    cachedDescriptors.set(route.key, descriptor);
                  }}
                  onDidDisappear={() => {
                    console.log('onDidDisappear');
                    navigation.emit({
                      type: 'transitionEnd',
                      data: { closing: true },
                      target: route.key,
                    });
                  }}
                  onDismiss={() => {
                    console.log('dismissing');
                    navigation.dispatch({
                      ...StackActions.pop(),
                      source: route.key,
                      target: state.key,
                    });
                  }}
                  onNativeDismiss={() => {
                    console.log('dismissing');
                    navigation.dispatch({
                      ...StackActions.pop(),
                      source: route.key,
                      target: state.key,
                    });
                  }}>
                  {descriptor.render()}
                </Stack.Screen>
              </NavigationRouteContext.Provider>
            </NavigationContext.Provider>
          );
        })}
      </Stack.Host>
    </SafeAreaProviderCompat>
  );
}
