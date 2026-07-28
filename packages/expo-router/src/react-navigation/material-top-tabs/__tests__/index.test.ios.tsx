import { userEvent } from '@testing-library/react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { PagerViewProps } from 'react-native-pager-view';
import { TabView, type TabBarProps, type TabViewProps } from 'react-native-tab-view';

import { router } from '../../../imperative-api';
import { TopTabs } from '../../../layouts/TopTabs';
import { act, renderRouter, screen } from '../../../testing-library';
import { useNavigation } from '../../../useNavigation';
import { Text } from '../../elements';
import type { ParamListBase } from '../../native';
import type {
  MaterialTopTabBarProps,
  MaterialTopTabNavigationProp,
  MaterialTopTabViewRoute,
} from '../types';

const getTabViewProps = () => {
  const mockTabView = jest.mocked(TabView);
  return mockTabView.mock.calls.at(-1)![0];
};

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

jest.mock('react-native-pager-view', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');

  return class ViewPager extends React.Component<PagerViewProps> {
    setPage() {}

    render() {
      return <View>{this.props.children}</View>;
    }
  };
});

jest.mock(
  'react-native-tab-view',
  () => {
    const { Animated, View, Text, Pressable } =
      require('react-native') as typeof import('react-native');

    return {
      TabView: jest.fn((props: TabViewProps<MaterialTopTabViewRoute>) => {
        const { navigationState, renderScene, renderTabBar, lazy, onIndexChange } = props;
        const position = new Animated.Value(0).interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });
        const layout = { width: 0, height: 0 };
        const jumpTo = (routeKey: string) => {
          onIndexChange(navigationState.routes.findIndex((route) => route.key === routeKey));
        };

        return (
          <View>
            {renderTabBar?.({ navigationState, options: {}, jumpTo, layout, position })}
            {navigationState.routes.map((route, index) => {
              const isLazy = typeof lazy === 'function' ? lazy({ route }) : lazy;

              return index === navigationState.index || !isLazy ? (
                <View
                  key={route.key}
                  style={index === navigationState.index ? undefined : { display: 'none' }}>
                  {renderScene({ route, position, layout, jumpTo })}
                </View>
              ) : null;
            })}
          </View>
        );
      }),
      TabBar: ({
        navigationState,
        onTabPress,
        options,
        jumpTo,
      }: TabBarProps<MaterialTopTabViewRoute>) => {
        return (
          <View>
            {navigationState.routes.map((route) => (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                onPress={() => {
                  let defaultPrevented = false;
                  onTabPress?.({
                    route,
                    defaultPrevented,
                    preventDefault: () => {
                      defaultPrevented = true;
                    },
                  });
                  if (!defaultPrevented) {
                    jumpTo(route.key);
                  }
                }}>
                <Text>{options?.[route.key]?.labelText ?? route.name}</Text>
              </Pressable>
            ))}
          </View>
        );
      },
      TabBarIndicator: () => null,
    };
  },
  { virtual: true }
);

afterEach(() => {
  warnSpy.mockRestore();
  jest.restoreAllMocks();
});

test('renders a material top tab navigator and navigates between screens on tab press', async () => {
  renderRouter({
    _layout: () => (
      <TopTabs>
        <TopTabs.Screen name="index" />
        <TopTabs.Screen name="second" />
      </TopTabs>
    ),
    index: () => <Text>Screen index</Text>,
    second: () => <Text>Screen second</Text>,
  });

  expect(screen.getByText('Screen index')).toBeVisible();
  expect(screen.queryByText('Screen second')).not.toBeVisible();

  await userEvent.press(screen.getByRole('tab', { name: 'second' }));

  expect(screen.getByText('Screen second')).toBeVisible();
  expect(screen).toHavePathname('/second');
});

test('renders only declared tabs and redirects from undeclared routes', () => {
  renderRouter({
    _layout: () => (
      <TopTabs>
        <TopTabs.Screen name="index" />
      </TopTabs>
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });

  expect(screen.queryByRole('tab', { name: 'second' })).toBeNull();

  act(() => router.push('/second'));

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.queryByTestId('second')).toBeNull();
  expect(screen).toHavePathname('/');
});

test('removes and redirects from a hidden tab', () => {
  renderRouter({
    _layout: () => (
      <TopTabs>
        <TopTabs.Screen name="index" />
        <TopTabs.Screen name="second" options={{ hidden: true }} />
      </TopTabs>
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });

  expect(screen.queryByRole('tab', { name: 'second' })).toBeNull();

  act(() => router.push('/second'));

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeVisible();
});

test('renders no top tab UI when no screens are declared in the layout', () => {
  renderRouter({
    _layout: () => <TopTabs />,
    index: () => <View testID="index" />,
  });

  expect(screen.queryByTestId('index')).toBeNull();
  expect(screen.queryAllByRole('tab')).toHaveLength(0);
  expect(warnSpy.mock.calls).toMatchSnapshot();
});

test('does not navigate when a tabPress listener prevents the default action', async () => {
  renderRouter({
    _layout: () => (
      <TopTabs
        screenListeners={{
          tabPress: (event: { preventDefault: () => void }) => event.preventDefault(),
        }}>
        <TopTabs.Screen name="index" />
        <TopTabs.Screen name="second" />
      </TopTabs>
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });

  await userEvent.press(screen.getByRole('tab', { name: 'second' }));

  expect(screen).toHavePathname('/');
});

test('renders a custom tabBar with standard navigation props', async () => {
  let tabBarProps: MaterialTopTabBarProps | undefined;

  renderRouter({
    _layout: () => (
      <TopTabs
        tabBar={(props: MaterialTopTabBarProps) => {
          tabBarProps = props;
          return (
            <Text
              testID="second-tab"
              onPress={() => props.navigateToTab(props.state.routes[1]!.key)}>
              {props.descriptors[props.state.routes[1]!.key]!.options.title}
            </Text>
          );
        }}>
        <TopTabs.Screen name="index" />
        <TopTabs.Screen name="second" options={{ title: 'Second' }} />
      </TopTabs>
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });

  expect(screen.getByTestId('second-tab')).toHaveTextContent('Second');
  expect(tabBarProps).toEqual(
    expect.objectContaining({
      state: expect.any(Object),
      descriptors: expect.any(Object),
      emitter: expect.any(Object),
      navigateToTab: expect.any(Function),
    })
  );
  expect(tabBarProps).not.toHaveProperty('navigation');

  await userEvent.press(screen.getByTestId('second-tab'));

  expect(screen).toHavePathname('/second');
});

test('lets a tabPress listener prevent navigation from a custom tabBar', async () => {
  function CustomTabBar({ state, emitter, navigateToTab }: MaterialTopTabBarProps) {
    const route = state.routes[1]!;
    return (
      <Text
        testID="second-tab"
        onPress={() => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!event.defaultPrevented) {
            navigateToTab(route.key);
          }
        }}>
        {route.name}
      </Text>
    );
  }

  renderRouter({
    _layout: () => (
      <TopTabs
        screenListeners={{
          tabPress: (event: { preventDefault: () => void }) => event.preventDefault(),
        }}
        tabBar={(props: MaterialTopTabBarProps) => <CustomTabBar {...props} />}>
        <TopTabs.Screen name="index" />
        <TopTabs.Screen name="second" />
      </TopTabs>
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });

  await userEvent.press(screen.getByTestId('second-tab'));

  expect(screen).toHavePathname('/');
});

test('handles screens preloading', () => {
  renderRouter({
    _layout: () => (
      <TopTabs>
        <TopTabs.Screen name="index" />
        <TopTabs.Screen name="second" options={{ lazy: true }} />
      </TopTabs>
    ),
    index: () => null,
    second: () => <Text>Screen second</Text>,
  });

  expect(screen.queryByText('Screen second', { includeHiddenElements: true })).toBeNull();

  act(() => router.prefetch('/second'));

  const tabViewProps = getTabViewProps();
  const secondRoute = tabViewProps.navigationState.routes[1]!;
  if (typeof tabViewProps.lazy !== 'function') {
    throw new Error('Expected `lazy` to be a function.');
  }
  expect(tabViewProps.lazy({ route: secondRoute })).toBe(false);
  expect(screen.queryByText('Screen second', { includeHiddenElements: true })).not.toBeNull();
});

test('warns when navigateToTab receives an unknown route key', () => {
  renderRouter({
    _layout: () => (
      <TopTabs
        tabBar={({ navigateToTab }: MaterialTopTabBarProps) => (
          <Text testID="unknown-tab" onPress={() => navigateToTab('unknown-key')} />
        )}>
        <TopTabs.Screen name="index" />
      </TopTabs>
    ),
    index: () => null,
  });

  act(() => screen.getByTestId('unknown-tab').props.onPress());

  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Top tabs could not switch'));
});

test('emits swipeStart and swipeEnd events', async () => {
  const onSwipeStart = jest.fn();
  const onSwipeEnd = jest.fn();

  function Index() {
    const navigation = useNavigation<MaterialTopTabNavigationProp<ParamListBase>>();
    useEffect(() => {
      const removeStart = navigation.addListener('swipeStart', onSwipeStart);
      const removeEnd = navigation.addListener('swipeEnd', onSwipeEnd);
      return () => {
        removeStart();
        removeEnd();
      };
    }, [navigation]);
    return null;
  }

  renderRouter({
    _layout: () => (
      <TopTabs>
        <TopTabs.Screen name="index" />
      </TopTabs>
    ),
    index: Index,
  });

  const tabViewProps = getTabViewProps();
  if (!tabViewProps.onSwipeStart || !tabViewProps.onSwipeEnd) {
    throw new Error('Expected swipe callbacks.');
  }
  act(() => tabViewProps.onSwipeStart?.());
  act(() => tabViewProps.onSwipeEnd?.());

  expect(onSwipeStart).toHaveBeenCalledTimes(1);
  expect(onSwipeEnd).toHaveBeenCalledTimes(1);
});

test('renders tabs in route names order while preserving focus', async () => {
  let reverse!: () => void;

  function Layout() {
    const [reversed, setReversed] = useState(false);
    reverse = () => setReversed(true);
    const screens = [
      <TopTabs.Screen key="index" name="index" />,
      <TopTabs.Screen key="second" name="second" />,
    ];
    return (
      <TopTabs
        tabBar={({ state }: MaterialTopTabBarProps) => (
          <View>
            {state.routes.map((route: MaterialTopTabViewRoute, index: number) => (
              <Text key={route.key} testID={`tab-${index}`}>
                {route.name}:{route.key === state.routes[state.index]!.key ? 'focused' : 'blurred'}
              </Text>
            ))}
          </View>
        )}>
        {reversed ? screens.reverse() : screens}
      </TopTabs>
    );
  }

  renderRouter({
    _layout: Layout,
    index: () => <Text>Screen index</Text>,
    second: () => <Text>Screen second</Text>,
  });

  act(() => router.navigate('/second'));
  act(() => reverse());

  expect(screen.getByTestId('tab-0')).toHaveTextContent('second:focused');
  expect(screen.getByTestId('tab-1')).toHaveTextContent('index:blurred');
  expect(screen.getByText('Screen second')).toBeVisible();
});
