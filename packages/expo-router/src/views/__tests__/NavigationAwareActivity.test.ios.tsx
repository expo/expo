import { act, render } from '@testing-library/react-native';
import * as React from 'react';
import { View } from 'react-native';

import { router } from '../../imperative-api';
import JSStack from '../../layouts/JSStack';
import Stack from '../../layouts/Stack';
import Tabs from '../../layouts/Tabs';
import { NativeTabs } from '../../native-tabs';
import { CommonActions, StackRouter, useNavigation, useRoute } from '../../react-navigation/native';
import {
  unstable_createStandardRouterNavigator,
  type NavigatorContentProps,
} from '../../standard-navigation';
import { renderRouter, screen } from '../../testing-library';
import { TabList, TabSlot, TabTrigger, Tabs as HeadlessTabs } from '../../ui';
import {
  NavigationAwareActivity,
  useActivityMode,
  type ActivityMode,
} from '../NavigationAwareActivity';
import { Slot } from '../Navigator';

jest.mock('../ActivityContents', () => ({
  ActivityContents: ({ children, mode }: React.ActivityProps) => {
    const React = require('react') as typeof import('react');
    const { View } = require('react-native') as typeof import('react-native');
    return (
      <View testID="activity-contents" accessibilityLabel={mode}>
        <React.Activity mode={mode}>{children}</React.Activity>
      </View>
    );
  },
}));

jest.mock('react-native-screens', () => {
  const { View } = jest.requireActual('react-native') as typeof import('react-native');
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    Tabs: {
      ...actualScreens.Tabs,
      Host: jest.fn(({ children }) => <View>{children}</View>),
      Screen: jest.fn(({ children }) => <View>{children}</View>),
    },
  };
});

function EmptyScreen() {
  return null;
}

function getActivityModes(testID: string) {
  const modes: ActivityMode[] = [];
  let node = screen.UNSAFE_getByProps({ testID });

  while (node.parent) {
    node = node.parent;
    if (node.type === View && node.props.testID === 'activity-contents') {
      modes.push(node.props.accessibilityLabel);
    }
  }

  return modes;
}

function expectActivityModes(expected: Record<string, ActivityMode[]>) {
  for (const [testID, modes] of Object.entries(expected)) {
    expect(getActivityModes(testID)).toEqual(modes);
  }
}

const ActivityStack = unstable_createStandardRouterNavigator(
  ({ state, descriptors }: NavigatorContentProps<object>) =>
    state.routes.map((route) => (
      <React.Fragment key={route.key}>{descriptors[route.key]?.render()}</React.Fragment>
    )),
  StackRouter,
  { activityDefaultThreshold: 1 }
);

function renderModes({ tabs = false, threshold }: { tabs?: boolean; threshold?: number } = {}) {
  const modes: Record<string, ActivityMode> = {};

  function ModeReporter() {
    const route = useRoute();
    modes[route.name] = useActivityMode(threshold);
    return null;
  }

  renderRouter({
    _layout: () =>
      tabs ? (
        <Tabs>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="b" />
          <Tabs.Screen name="c" />
          <Tabs.Screen name="d" />
          <Tabs.Screen name="e" />
        </Tabs>
      ) : (
        <Stack />
      ),
    index: ModeReporter,
    b: ModeReporter,
    c: ModeReporter,
    d: ModeReporter,
    e: ModeReporter,
  });

  return modes;
}

test('hides stack screens at the default depth', () => {
  const modes = renderModes();

  act(() => router.push('/b'));
  act(() => router.push('/c'));
  act(() => router.push('/d'));
  act(() => router.push('/e'));

  expect(modes).toEqual({
    index: 'hidden',
    b: 'hidden',
    c: 'hidden',
    d: 'visible',
    e: 'visible',
  });

  act(() => router.back());

  expect(modes).toEqual({
    index: 'hidden',
    b: 'hidden',
    c: 'visible',
    d: 'visible',
    e: 'visible',
  });
});

test.each([
  {
    threshold: 1,
    navigate: () => {
      router.push('/b');
      router.push('/c');
    },
    expected: { index: 'hidden', b: 'hidden', c: 'visible' },
  },
  {
    threshold: 3,
    navigate: () => {
      router.push('/b');
      router.push('/c');
      router.push('/d');
    },
    expected: { index: 'hidden', b: 'visible', c: 'visible', d: 'visible' },
  },
] as const)('supports stack depth $threshold', ({ threshold, navigate, expected }) => {
  const modes = renderModes({ threshold });

  act(navigate);

  expect(modes).toEqual(expected);
});

test.each([
  {
    threshold: 1,
    expected: {
      index: 'hidden',
      b: 'hidden',
      c: 'hidden',
      d: 'hidden',
      e: 'visible',
    },
  },
  {
    threshold: 2,
    expected: {
      index: 'visible',
      b: 'visible',
      c: 'visible',
      d: 'visible',
      e: 'visible',
    },
  },
] as const)('uses depth $threshold for tabs', ({ threshold, expected }) => {
  const modes = renderModes({ tabs: true, threshold });

  act(() => router.navigate('/b'));
  act(() => router.navigate('/c'));
  act(() => router.navigate('/d'));
  act(() => router.navigate('/e'));

  expect(modes).toEqual(expected);

  if (threshold === 1) {
    act(() => router.navigate('/b'));
    expect(modes.index).toBe('hidden');
    expect(modes.b).toBe('visible');
  }
});

test('keeps preloaded stack routes visible', () => {
  const modes: Record<string, ActivityMode> = {};
  let preload = () => {};

  function ModeReporter() {
    const navigation = useNavigation();
    const route = useRoute();
    modes[route.name] = useActivityMode();

    if (route.name === 'index') {
      preload = () => navigation.dispatch(CommonActions.preload('b'));
    }

    return null;
  }

  renderRouter({ _layout: () => <JSStack />, index: ModeReporter, b: ModeReporter });

  act(preload);

  expect(modes.b).toBe('visible');
});

test('automatically wraps screens when enabled on a navigator', () => {
  renderRouter({
    _layout: () => <JSStack activityEnabled />,
    index: () => <View testID="index" />,
    b: () => <View testID="b" />,
    c: () => <View testID="c" />,
  });

  expectActivityModes({ index: ['visible'] });

  act(() => router.push('/b'));
  expectActivityModes({ index: ['visible'], b: ['visible'] });

  act(() => router.push('/c'));
  expectActivityModes({ index: ['hidden'], b: ['visible'], c: ['visible'] });
});

test('uses the navigator activity default threshold', () => {
  renderRouter({
    _layout: () => <ActivityStack activityEnabled />,
    index: () => <View testID="index" />,
    b: () => <View testID="b" />,
  });

  expectActivityModes({ index: ['visible'] });

  act(() => router.push('/b'));
  expectActivityModes({ index: ['hidden'], b: ['visible'] });
});

test('uses depth 1 for Slot', () => {
  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <Tabs.Screen name="(home)" />
          <Tabs.Screen name="other" />
        </Tabs>
      ),
      '(home)/_layout': () => <Slot activityEnabled />,
      '(home)/index': () => <View testID="index" />,
      other: () => <View testID="other" />,
    },
    { initialUrl: '/' }
  );

  expectActivityModes({ index: ['visible'] });

  act(() => router.navigate('/other'));
  expectActivityModes({ index: ['hidden'], other: [] });
});

describe('invalid activity threshold', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  test.each([0, -1, NaN])('disables activity for %s', (activityEnabled) => {
    renderRouter({
      _layout: () => <JSStack activityEnabled={activityEnabled} />,
      index: () => <View testID="index" />,
    });

    expectActivityModes({ index: [] });
    expect(warn).toHaveBeenCalledWith(
      `activityEnabled must be a positive number. Received ${activityEnabled}; disabling React Activity.`
    );
  });
});

test('counts screens above only in the current navigator', () => {
  renderRouter(
    {
      _layout: () => <JSStack activityEnabled />,
      '(tabs)/_layout': () => (
        <Tabs activityEnabled>
          <Tabs.Screen name="home" />
          <Tabs.Screen name="other" />
        </Tabs>
      ),
      '(tabs)/home/_layout': () => <JSStack activityEnabled />,
      '(tabs)/home/index': () => <View testID="home-index" />,
      '(tabs)/home/details': () => <View testID="home-details" />,
      '(tabs)/other': () => <View testID="other" />,
      modal: () => <View testID="modal" />,
    },
    { initialUrl: '/home' }
  );

  expectActivityModes({ 'home-index': ['visible'] });

  act(() => router.push('/home/details'));
  expectActivityModes({ 'home-index': ['visible'], 'home-details': ['visible'] });

  act(() => router.navigate('/other'));
  expectActivityModes({
    'home-index': ['visible'],
    'home-details': ['visible'],
    other: ['visible'],
  });

  act(() => router.push('/modal'));
  expectActivityModes({
    'home-index': ['visible'],
    'home-details': ['visible'],
    other: ['hidden'],
    modal: ['visible'],
  });
});

test('uses the nearest navigator or screen activity setting', () => {
  renderRouter({
    _layout: () => (
      <Tabs activityEnabled>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="inherited" />
        <Tabs.Screen name="disabled" activityEnabled={false} />
      </Tabs>
    ),
    index: () => <View testID="index" />,
    inherited: () => <View testID="inherited" />,
    disabled: () => <View testID="disabled" />,
  });

  expectActivityModes({ index: ['visible'] });

  act(() => router.navigate('/inherited'));
  expectActivityModes({ index: ['hidden'], inherited: ['visible'] });

  act(() => router.navigate('/disabled'));
  expectActivityModes({ index: ['hidden'], inherited: ['hidden'], disabled: [] });
});

test('does not inherit activity from a parent navigator', () => {
  renderRouter(
    {
      _layout: () => <JSStack activityEnabled />,
      '(tabs)/_layout': () => (
        <Tabs>
          <Tabs.Screen name="index" />
        </Tabs>
      ),
      '(tabs)/index': () => <View testID="index" />,
    },
    { initialUrl: '/' }
  );

  expectActivityModes({ index: [] });
});

test('uses NativeTabs trigger activity settings', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs activityEnabled>
        <NativeTabs.Trigger name="index" activityEnabled />
        <NativeTabs.Trigger name="disabled" activityEnabled={false} />
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
    disabled: () => <View testID="disabled" />,
  });

  expectActivityModes({ index: ['visible'] });

  act(() => router.navigate('/disabled'));
  expectActivityModes({ index: ['hidden'], disabled: [] });
});

test('uses headless tab trigger activity settings', () => {
  renderRouter({
    _layout: () => (
      <HeadlessTabs activityEnabled>
        <TabSlot />
        <TabList>
          <TabTrigger name="index" href="/" activityEnabled />
          <TabTrigger name="disabled" href="/disabled" activityEnabled={false} />
        </TabList>
      </HeadlessTabs>
    ),
    index: () => <View testID="index" />,
    disabled: () => <View testID="disabled" />,
  });

  expectActivityModes({ index: ['visible'] });

  act(() => router.navigate('/disabled'));
  expectActivityModes({ index: ['hidden'], disabled: [] });
});

test('wraps route modules but not layout modules', () => {
  renderRouter(
    {
      _layout: () => (
        <View testID="root-layout">
          <JSStack activityEnabled />
        </View>
      ),
      'nested/_layout': () => (
        <View testID="nested-layout">
          <JSStack activityEnabled />
        </View>
      ),
      'nested/index': () => <View testID="route" />,
    },
    { initialUrl: '/nested' }
  );

  expectActivityModes({
    'root-layout': [],
    'nested-layout': [],
    route: ['visible'],
  });
});

test('manual activity only counts screens above in the current navigator', () => {
  renderRouter(
    {
      _layout: () => <JSStack />,
      '(tabs)/_layout': () => (
        <Tabs>
          <Tabs.Screen name="home" />
          <Tabs.Screen name="other" />
        </Tabs>
      ),
      '(tabs)/home/_layout': () => <JSStack />,
      '(tabs)/home/index': () => (
        <NavigationAwareActivity>
          <View testID="home-index" />
        </NavigationAwareActivity>
      ),
      '(tabs)/home/details': EmptyScreen,
      '(tabs)/other': EmptyScreen,
    },
    { initialUrl: '/home' }
  );

  expectActivityModes({ 'home-index': ['visible'] });

  act(() => router.push('/home/details'));
  expectActivityModes({ 'home-index': ['visible'] });

  act(() => router.navigate('/other'));
  expectActivityModes({ 'home-index': ['visible'] });
});

test('cleans up effects while preserving local state', async () => {
  const effect = jest.fn();
  const cleanup = jest.fn();
  const renderedValues: number[] = [];
  let setValue: React.Dispatch<React.SetStateAction<number>> = () => {};

  function StatefulScreen() {
    const [value, updateValue] = React.useState(0);
    setValue = updateValue;
    renderedValues.push(value);

    React.useEffect(() => {
      effect();
      return cleanup;
    }, []);

    return null;
  }

  renderRouter({
    _layout: () => <JSStack />,
    index: () => (
      <NavigationAwareActivity>
        <StatefulScreen />
      </NavigationAwareActivity>
    ),
    b: EmptyScreen,
    c: EmptyScreen,
  });

  act(() => setValue(1));
  act(() => router.push('/b'));
  act(() => router.push('/c'));

  expect(cleanup).toHaveBeenCalledTimes(1);

  await act(async () => router.back());

  expect(effect).toHaveBeenCalledTimes(2);
  expect(renderedValues.at(-1)).toBe(1);
});

test('throws outside a screen', () => {
  expect(() => render(<NavigationAwareActivity>content</NavigationAwareActivity>)).toThrow(
    'NavigationAwareActivity must be rendered inside a screen component.'
  );
});

test('throws when wrapping a layout navigator', () => {
  expect(() =>
    renderRouter({
      _layout: () => (
        <NavigationAwareActivity>
          <Stack />
        </NavigationAwareActivity>
      ),
      index: EmptyScreen,
    })
  ).toThrow('NavigationAwareActivity must be rendered inside a screen component.');
});
