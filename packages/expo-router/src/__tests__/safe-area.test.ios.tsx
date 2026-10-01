import { useEffect, useState } from 'react';
import { Button, View } from 'react-native';

import JSStack from '../layouts/JSStack';
import { Stack } from '../layouts/Stack';
import { NativeTabs } from '../native-tabs';
import { act, fireEvent, renderRouter, screen } from '../testing-library';
import { Slot } from '../views/Navigator';

jest.mock('react-native-screens/experimental', () => {
  const { View } = jest.requireActual('react-native');
  return {
    ...jest.requireActual('react-native-screens/experimental'),
    SafeAreaView: (
      props: React.ComponentProps<typeof import('react-native-screens/experimental').SafeAreaView>
    ) => (
      <View
        {...props}
        testID={props.edges?.left !== undefined ? 'leaf-safe-area' : 'tabs-bottom-safe-area'}
      />
    ),
  };
});

jest.mock('react-native-screens', () => {
  const actual = jest.requireActual('react-native-screens');
  const { View } = jest.requireActual('react-native');
  return {
    ...actual,
    Tabs: {
      ...actual.Tabs,
      Host: ({ children }: React.PropsWithChildren) => <View>{children}</View>,
      Screen: ({ children }: React.PropsWithChildren) => <View>{children}</View>,
    },
  };
});

const defaults = { left: true, right: true, top: false, bottom: false };
const disabled = { left: false, right: false, top: false, bottom: false };

test('wraps only native stack leaves with horizontal safe area by default', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      'nested/_layout': () => <Stack />,
      'nested/index': () => <View testID="content" />,
    },
    { initialUrl: '/nested' }
  );
  expect(screen.getAllByTestId('leaf-safe-area')).toHaveLength(1);
  expect(screen.getByTestId('leaf-safe-area').props).toMatchObject({
    edges: defaults,
    collapsable: false,
    style: { flex: 1 },
  });
  expect(screen.getByTestId('content')).toBeVisible();
});

test.each(['slot', 'custom', 'no-layout'])('does not wrap %s routes', (layout) => {
  renderRouter({
    ...(layout === 'slot'
      ? { _layout: () => <Slot /> }
      : layout === 'custom'
        ? { _layout: () => <JSStack /> }
        : {}),
    index: () => <View />,
  });
  expect(screen.queryByTestId('leaf-safe-area')).toBeNull();
});

test.each(['object', 'function'])(
  'converts direct layout props with %s options and resolves individual overrides',
  (form) => {
    renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen
            name="index"
            safeAreaEdges={{
              horizontal: false,
              vertical: true,
              left: true,
              bottom: false,
            }}
            options={form === 'function' ? () => ({ title: 'Home' }) : { title: 'Home' }}
          />
        </Stack>
      ),
      index: () => <View />,
    });
    expect(screen.getByTestId('leaf-safe-area').props.edges).toEqual({
      left: true,
      right: false,
      top: true,
      bottom: false,
    });
  }
);

test('page-local updates change edges without remounting the route', () => {
  const mount = jest.fn();
  renderRouter({
    _layout: () => <Stack />,
    index: function Page() {
      const [enabled, setEnabled] = useState(true);
      useEffect(() => {
        mount();
      }, []);
      return (
        <>
          <Stack.Screen safeAreaEdges={{ horizontal: enabled }} />
          <Button testID="toggle" title="toggle" onPress={() => setEnabled((value) => !value)} />
        </>
      );
    },
  });
  expect(screen.getByTestId('leaf-safe-area').props.edges).toEqual(defaults);
  act(() => fireEvent.press(screen.getByTestId('toggle')));
  expect(screen.getByTestId('leaf-safe-area').props.edges).toEqual(disabled);
  expect(mount).toHaveBeenCalledTimes(1);
});

test('nested stack axes override inherited resolved individual edges', () => {
  renderRouter(
    {
      _layout: () => (
        <Stack>
          <Stack.Screen name="nested" safeAreaEdges={{ left: false, top: true }} />
        </Stack>
      ),
      'nested/_layout': () => (
        <Stack>
          <Stack.Screen name="index" safeAreaEdges={{ horizontal: true, bottom: true }} />
        </Stack>
      ),
      'nested/index': () => <View />,
    },
    { initialUrl: '/nested' }
  );
  expect(screen.getByTestId('leaf-safe-area').props.edges).toEqual({
    left: true,
    right: true,
    top: true,
    bottom: true,
  });
});

test('parent edge updates cross protected screens and nested static containers without remounting', () => {
  const mount = jest.fn();
  renderRouter(
    {
      _layout: function Layout() {
        const [enabled, setEnabled] = useState(true);
        return (
          <>
            <Button testID="parent-toggle" title="toggle" onPress={() => setEnabled(false)} />
            <Stack>
              <Stack.Protected guard>
                <Stack.Screen name="nested" safeAreaEdges={{ horizontal: enabled }} />
              </Stack.Protected>
            </Stack>
          </>
        );
      },
      'nested/_layout': () => <Stack />,
      'nested/index': function Page() {
        useEffect(() => {
          mount();
        }, []);
        return <View />;
      },
    },
    { initialUrl: '/nested' }
  );
  expect(screen.getByTestId('leaf-safe-area').props.edges).toEqual(defaults);
  act(() => fireEvent.press(screen.getByTestId('parent-toggle')));
  expect(screen.getByTestId('leaf-safe-area').props.edges).toEqual(disabled);
  expect(mount).toHaveBeenCalledTimes(1);
});

test.each([undefined, true, false])(
  'tab disableAutomaticContentInsets=%s is inherited by nested stack leaves',
  (disable) => {
    renderRouter(
      {
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="nested" disableAutomaticContentInsets={disable} />
          </NativeTabs>
        ),
        'nested/_layout': () => <Stack />,
        'nested/index': () => <View />,
      },
      { initialUrl: '/nested' }
    );
    expect(screen.getAllByTestId('leaf-safe-area')).toHaveLength(1);
    expect(screen.getByTestId('leaf-safe-area').props.edges).toEqual(disable ? disabled : defaults);
  }
);

test('explicit tab edges enable padding after disabling automatic insets', () => {
  renderRouter(
    {
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger
            name="nested"
            disableAutomaticContentInsets
            safeAreaEdges={{ left: true, vertical: true }}
          />
        </NativeTabs>
      ),
      'nested/_layout': () => (
        <Stack>
          <Stack.Screen name="index" safeAreaEdges={{ top: false }} />
        </Stack>
      ),
      'nested/index': () => <View />,
    },
    { initialUrl: '/nested' }
  );
  expect(screen.getByTestId('leaf-safe-area').props.edges).toEqual({
    left: true,
    right: false,
    top: false,
    bottom: true,
  });
});

test('a child stack axis explicitly enables padding under a disabled tab', () => {
  renderRouter(
    {
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="nested" disableAutomaticContentInsets />
        </NativeTabs>
      ),
      'nested/_layout': () => (
        <Stack>
          <Stack.Screen name="index" safeAreaEdges={{ horizontal: true }} />
        </Stack>
      ),
      'nested/index': () => <View />,
    },
    { initialUrl: '/nested' }
  );
  expect(screen.getByTestId('leaf-safe-area').props.edges).toEqual(defaults);
});

test('dynamic tab edges update while an omitted prop preserves layout edges', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index" safeAreaEdges={{ horizontal: false }} />
      </NativeTabs>
    ),
    index: function Page() {
      const [enabled, setEnabled] = useState(false);
      return (
        <>
          <NativeTabs.Trigger {...(enabled ? { safeAreaEdges: { horizontal: true } } : {})} />
          <Button testID="toggle" title="toggle" onPress={() => setEnabled(true)} />
        </>
      );
    },
  });
  expect(screen.getByTestId('leaf-safe-area').props.edges).toEqual(disabled);
  act(() => fireEvent.press(screen.getByTestId('toggle')));
  expect(screen.getByTestId('leaf-safe-area').props.edges).toEqual(defaults);
});
