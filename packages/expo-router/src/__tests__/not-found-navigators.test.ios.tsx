import { act, screen } from '@testing-library/react-native';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { Text, View } from 'react-native';
import { createStandardNavigator } from 'standard-navigation';

import { router } from '../imperative-api';
import {
  Navigator,
  type NavigatorContentProps,
  StackRouter,
  unstable_integrateWithRouter,
} from '../index';
import Drawer from '../layouts/Drawer';
import JSStack from '../layouts/JSStack';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import TopTabs from '../layouts/TopTabs';
import { ExperimentalStack } from '../layouts/experimental-stack';
import { NativeTabs } from '../native-tabs';
import { renderRouter } from '../testing-library';

jest.mock('react-native-drawer-layout', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    'react-native-drawer-layout'
  ) as typeof import('react-native-drawer-layout');

  return {
    ...actual,
    Drawer: ({ children }: ComponentProps<typeof actual.Drawer>) => <View>{children}</View>,
  };
});

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');

  return {
    ...actual,
    Tabs: {
      ...actual.Tabs,
      Host: ({ children }: { children?: ReactNode }) => <View>{children}</View>,
      Screen: ({ children }: { children?: ReactNode }) => <View>{children}</View>,
    },
  };
});

jest.mock('react-native-screens/experimental', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    'react-native-screens/experimental'
  ) as typeof import('react-native-screens/experimental');

  return {
    ...actual,
    Stack: {
      Host: ({ children }: { children?: ReactNode }) => <View>{children}</View>,
      Screen: ({ children }: { children?: ReactNode }) => <View>{children}</View>,
      HeaderConfig: () => null,
    },
  };
});

type NavigatorLayout = (explicitNotFound: boolean) => ReactElement;

function StandardNavigatorContent({ state, descriptors }: NavigatorContentProps<object>) {
  const focusedRouteKey = state.routes[state.index]?.key;
  return focusedRouteKey ? descriptors[focusedRouteKey]?.render() : null;
}

const standardNavigator = createStandardNavigator(StandardNavigatorContent);
const IntegratedNavigator = unstable_integrateWithRouter(standardNavigator, StackRouter);

const navigatorLayouts = [
  [
    'headless Navigator',
    (explicitNotFound) => (
      <Navigator>
        <Navigator.Screen name="index" />
        {explicitNotFound && <Navigator.Screen name="+not-found" />}
        <Navigator.Slot />
      </Navigator>
    ),
  ],
  [
    'integrated standard navigator',
    (explicitNotFound) =>
      explicitNotFound ? (
        <IntegratedNavigator>
          <IntegratedNavigator.Screen name="index" />
          <IntegratedNavigator.Screen name="+not-found" />
        </IntegratedNavigator>
      ) : (
        <IntegratedNavigator>
          <IntegratedNavigator.Screen name="index" />
        </IntegratedNavigator>
      ),
  ],
  [
    'native stack',
    (explicitNotFound) =>
      explicitNotFound ? (
        <Stack>
          <Stack.Screen name="index" />
          <Stack.Screen name="+not-found" />
        </Stack>
      ) : (
        <Stack>
          <Stack.Screen name="index" />
        </Stack>
      ),
  ],
  [
    'JS stack',
    (explicitNotFound) =>
      explicitNotFound ? (
        <JSStack>
          <JSStack.Screen name="index" />
          <JSStack.Screen name="+not-found" />
        </JSStack>
      ) : (
        <JSStack>
          <JSStack.Screen name="index" />
        </JSStack>
      ),
  ],
  [
    'JS tabs',
    (explicitNotFound) =>
      explicitNotFound ? (
        <Tabs>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="+not-found" />
        </Tabs>
      ) : (
        <Tabs>
          <Tabs.Screen name="index" />
        </Tabs>
      ),
  ],
  [
    'top tabs',
    (explicitNotFound) =>
      explicitNotFound ? (
        <TopTabs>
          <TopTabs.Screen name="index" />
          <TopTabs.Screen name="+not-found" />
        </TopTabs>
      ) : (
        <TopTabs>
          <TopTabs.Screen name="index" />
        </TopTabs>
      ),
  ],
  [
    'native tabs',
    (explicitNotFound) =>
      explicitNotFound ? (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="+not-found" />
        </NativeTabs>
      ) : (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
  ],
  [
    'drawer',
    (explicitNotFound) =>
      explicitNotFound ? (
        <Drawer>
          <Drawer.Screen name="index" />
          <Drawer.Screen name="+not-found" />
        </Drawer>
      ) : (
        <Drawer>
          <Drawer.Screen name="index" />
        </Drawer>
      ),
  ],
  [
    'experimental stack',
    (explicitNotFound) =>
      explicitNotFound ? (
        <ExperimentalStack>
          <ExperimentalStack.Screen name="index" />
          <ExperimentalStack.Screen name="+not-found" />
        </ExperimentalStack>
      ) : (
        <ExperimentalStack>
          <ExperimentalStack.Screen name="index" />
        </ExperimentalStack>
      ),
  ],
] satisfies [string, NavigatorLayout][];

describe.each(navigatorLayouts)('%s', (_, Layout) => {
  it.each([
    ['explicitly', true],
    ['implicitly', false],
  ])('opens +not-found when it is %s declared', (_, explicitNotFound) => {
    renderRouter({
      _layout: () => Layout(explicitNotFound),
      index: () => <View testID="index" />,
      '+not-found': () => <Text testID="not-found">Not found</Text>,
    });

    expect(screen.getByTestId('index')).toBeVisible();

    act(() => router.push('/unknown'));

    expect(screen.getByTestId('not-found')).toBeVisible();
    expect(screen).toHavePathname('/unknown');
    expect(screen).toHaveSegments(['+not-found']);
  });
});
