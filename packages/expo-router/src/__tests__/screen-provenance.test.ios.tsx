import type { NavigatorArgs } from 'standard-navigation';
import { Text } from 'react-native';

import { NativeTabs } from '../native-tabs/NativeTabs';
import {
  TabRouter,
  type ParamListBase,
  type TabNavigationState,
  type TabRouterOptions,
} from '../react-navigation/native';
import {
  unstable_createStandardRouterNavigator,
  type StandardNavigatorDescriptor,
} from '../standard-navigation';
import { renderRouter, screen } from '../testing-library';
import { TabList, TabTrigger, useTabsWithChildren } from '../ui';

const probeContent = jest.fn((args: NavigatorArgs<object, Record<string, never>>) =>
  args.descriptors[args.state.routes[args.state.index]!.key]!.render()
);

const Probe = unstable_createStandardRouterNavigator<
  object,
  TabNavigationState<ParamListBase>,
  Record<string, never>,
  object,
  TabRouterOptions
>(probeContent, TabRouter);

function descriptorByRouteName(
  name: string
): StandardNavigatorDescriptor<object> | undefined {
  const { state, descriptors } = probeContent.mock.calls.at(-1)![0];
  const route = state.routes.find((route) => route.name === name);
  return route ? (descriptors[route.key] as StandardNavigatorDescriptor<object>) : undefined;
}

beforeEach(() => {
  probeContent.mockClear();
});

it('marks layout-declared screens as layout and filesystem-only screens as filesystem', () => {
  renderRouter(
    {
      _layout: () => (
        <Probe>
          <Probe.Screen name="a" />
        </Probe>
      ),
      a: () => <Text testID="a">A</Text>,
      b: () => <Text testID="b">B</Text>,
    },
    { initialUrl: '/a' }
  );

  expect(descriptorByRouteName('a')?.routeSource).toBe('layout');
  expect(descriptorByRouteName('b')?.routeSource).toBe('filesystem');
});

it('marks screens declared by name matching an index file as layout', () => {
  renderRouter(
    {
      _layout: () => (
        <Probe>
          <Probe.Screen name="c" />
        </Probe>
      ),
      'c/index': () => <Text testID="c">C</Text>,
      d: () => <Text testID="d">D</Text>,
    },
    { initialUrl: '/c' }
  );

  expect(descriptorByRouteName('c/index')?.routeSource).toBe('layout');
  expect(descriptorByRouteName('d')?.routeSource).toBe('filesystem');
});

it('marks all screens as filesystem when the layout declares none', () => {
  renderRouter(
    {
      _layout: () => <Probe />,
      a: () => <Text testID="a">A</Text>,
      b: () => <Text testID="b">B</Text>,
    },
    { initialUrl: '/a' }
  );

  expect(descriptorByRouteName('a')?.routeSource).toBe('filesystem');
  expect(descriptorByRouteName('b')?.routeSource).toBe('filesystem');
});

it('keeps layout provenance when redirecting from a screen behind a failing guard', () => {
  renderRouter(
    {
      _layout: () => (
        <Probe>
          <Probe.Protected guard={false} redirectTo="/b">
            <Probe.Screen name="a" />
          </Probe.Protected>
        </Probe>
      ),
      a: () => <Text testID="a">A</Text>,
      b: () => <Text testID="b">B</Text>,
    },
    { initialUrl: '/a' }
  );

  expect(screen.getByTestId('b')).toBeVisible();
  expect(screen).toHavePathname('/b');
  expect(descriptorByRouteName('a')?.routeSource).toBe('layout');
  expect(descriptorByRouteName('b')?.routeSource).toBe('filesystem');
});

it('marks screens declared with NativeTabs.Trigger as layout', () => {
  renderRouter(
    {
      _layout: () => (
        <Probe>
          <NativeTabs.Trigger name="a" />
        </Probe>
      ),
      a: () => <Text testID="a">A</Text>,
      b: () => <Text testID="b">B</Text>,
    },
    { initialUrl: '/a' }
  );

  expect(descriptorByRouteName('a')?.routeSource).toBe('layout');
  expect(descriptorByRouteName('b')?.routeSource).toBe('filesystem');
});

it('marks screens declared with headless TabTrigger as layout', () => {
  const headlessTabsSpy = jest.fn(
    (_args: Pick<ReturnType<typeof useTabsWithChildren>, 'state' | 'descriptors'>) => undefined
  );

  function Layout() {
    const children = (
      <TabList>
        <TabTrigger name="a" href="/a" />
      </TabList>
    );
    const { state, descriptors, NavigationContent } = useTabsWithChildren({ children });
    headlessTabsSpy({ state, descriptors });
    return <NavigationContent>{children}</NavigationContent>;
  }

  renderRouter(
    {
      _layout: Layout,
      a: () => <Text testID="a">A</Text>,
      b: () => <Text testID="b">B</Text>,
    },
    { initialUrl: '/a' }
  );

  const { state, descriptors } = headlessTabsSpy.mock.calls.at(-1)![0];
  const route = state.routes.find((route) => route.name === 'a')!;
  expect(descriptors[route.key]!.routeSource).toBe('layout');
});
