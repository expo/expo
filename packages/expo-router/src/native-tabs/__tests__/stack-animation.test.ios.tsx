import { act } from '@testing-library/react-native';
import * as Linking from 'expo-linking';
import { View } from 'react-native';

import { router } from '../../imperative-api';
import Stack from '../../layouts/StackClient';
import { INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME } from '../../navigationParams';
import { renderRouter, screen } from '../../testing-library';
import { NativeTabs } from '../NativeTabs';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
    Tabs: {
      ...actualScreens.Tabs,
      Host: jest.fn(({ children }) => <View>{children}</View>),
      Screen: jest.fn(({ children }) => <View>{children}</View>),
    },
  };
});

// The testing library's expo-linking mock drops the `url` listener; record it so a test can
// deliver an incoming link the way the OS does.
jest.mock('expo-linking', () => ({
  ...jest.requireActual('expo-linking'),
  createURL: (path: string) => 'yourscheme://' + path,
  resolveScheme: () => 'yourscheme',
  addEventListener: jest.fn(() => ({ remove() {} })),
}));

const { ScreenStackItem } = jest.requireMock(
  'react-native-screens'
) as typeof import('react-native-screens');
const MockedScreenStackItem = ScreenStackItem as jest.MockedFunction<typeof ScreenStackItem>;
type StackItemProps = Parameters<typeof ScreenStackItem>[0];

function latestStackItemProps(routeName: string): StackItemProps | undefined {
  return MockedScreenStackItem.mock.calls
    .map((call) => call[0])
    .filter(
      (props) => typeof props.screenId === 'string' && props.screenId.startsWith(`${routeName}:`)
    )
    .at(-1);
}

const routes = {
  _layout: () => (
    <NativeTabs>
      <NativeTabs.Trigger name="first" />
      <NativeTabs.Trigger name="second" />
    </NativeTabs>
  ),
  'first/_layout': () => <Stack />,
  'first/index': () => <View testID="first-index" />,
  'second/_layout': () => <Stack />,
  'second/index': () => <View testID="second-index" />,
  'second/details': () => <View testID="second-details" />,
  'second/final': () => <View testID="second-final" />,
};

beforeEach(() => {
  MockedScreenStackItem.mockClear();
});

it('disables animation only for the first stack screen reached across tabs', async () => {
  const result = await renderRouter(routes, { initialUrl: '/first' });

  await act(() => router.push('/second/details'));

  expect(screen).toHavePathname('/second/details');
  expect(latestStackItemProps('details')?.stackAnimation).toBe('none');

  const tabsState = result.getRouterState()!.routes[0]!.state!;
  const secondTab = tabsState.routes.find((route) => route.name === 'second')!;
  const details = secondTab.state!.routes.find((route) => route.name === 'details')!;
  expect(details.params).toHaveProperty(INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME, true);

  await act(() => latestStackItemProps('details')!.onAppear!({} as never));

  const updatedTabsState = result.getRouterState()!.routes[0]!.state!;
  const updatedSecondTab = updatedTabsState.routes.find((route) => route.name === 'second')!;
  const updatedDetails = updatedSecondTab.state!.routes.find((route) => route.name === 'details')!;
  expect(updatedDetails.params).not.toHaveProperty(INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME);

  MockedScreenStackItem.mockClear();
  await act(() => router.push('/second/final'));

  expect(screen).toHavePathname('/second/final');
  expect(latestStackItemProps('final')?.stackAnimation).toBeUndefined();
});

it('keeps the default animation when pushing within the focused tab', async () => {
  await renderRouter(routes, { initialUrl: '/second' });

  await act(() => router.push('/second/details'));

  expect(screen).toHavePathname('/second/details');
  expect(latestStackItemProps('details')?.stackAnimation).toBeUndefined();
});

it('keeps the params of a cross-tab navigation to a mounted screen once it appears', async () => {
  const result = await renderRouter(routes, { initialUrl: '/first' });

  await act(() => router.push('/second?filter=paid'));
  // The second tab's stack mounts with its `index`; its route key is its stack item's screenId.
  // `onAppear` stands for the native transition end; nothing reads its event, hence `as never`.
  const secondIndexKey = result
    .getRouterState()!
    .routes[0]!.state!.routes.find((route) => route.name === 'second')!
    .state!.routes.find((route) => route.name === 'index')!.key;
  await act(() =>
    MockedScreenStackItem.mock.calls
      .map((call) => call[0])
      .filter((props) => props.screenId === secondIndexKey)
      .at(-1)!.onAppear!({} as never)
  );
  await act(() => router.navigate('/first'));
  MockedScreenStackItem.mockClear();
  await act(() => router.push('/second?filter=unpaid'));
  await act(() =>
    MockedScreenStackItem.mock.calls
      .map((call) => call[0])
      .filter((props) => props.screenId === secondIndexKey)
      .at(-1)!.onAppear!({} as never)
  );

  const secondIndex = result
    .getRouterState()!
    .routes[0]!.state!.routes.find((route) => route.name === 'second')!
    .state!.routes.find((route) => route.name === 'index')!;
  expect(secondIndex.key).toBe(secondIndexKey);
  expect(secondIndex.params).toEqual({ filter: 'unpaid' });
});

it('keeps the params of a cross-tab navigation that pops back to a mounted screen once it appears', async () => {
  const result = await renderRouter(
    {
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="first" />
          <NativeTabs.Trigger name="groups" />
        </NativeTabs>
      ),
      'first/_layout': () => <Stack />,
      'first/index': () => <View testID="first-index" />,
      'groups/_layout': () => <Stack />,
      'groups/index': () => <View testID="groups-index" />,
      'groups/[id]': () => <View testID="group" />,
      'groups/settings': () => <View testID="group-settings" />,
    },
    { initialUrl: '/first' }
  );

  await act(() => router.push('/groups/a'));
  // The groups stack is [index, [id]]; its route key is its stack item's screenId.
  // `onAppear` stands for the native transition end; nothing reads its event, hence `as never`.
  const groupKey = result
    .getRouterState()!
    .routes[0]!.state!.routes.find((route) => route.name === 'groups')!
    .state!.routes.find((route) => route.name === '[id]')!.key;
  await act(() =>
    MockedScreenStackItem.mock.calls
      .map((call) => call[0])
      .filter((props) => props.screenId === groupKey)
      .at(-1)!.onAppear!({} as never)
  );
  await act(() => router.push('/groups/settings?groupId=a'));
  await act(() => router.navigate('/first'));
  MockedScreenStackItem.mockClear();
  // An incoming link navigates with `pop: true`: it pops settings and gives the mounted [id]
  // screen a new query param. The router subscribed last, so its `url` listener is the last call.
  const urlListener = jest.mocked(Linking.addEventListener).mock.calls.at(-1)![1];
  await act(() => urlListener({ url: 'yourscheme:///groups/a?tab=members' }));
  await act(() =>
    MockedScreenStackItem.mock.calls
      .map((call) => call[0])
      .filter((props) => props.screenId === groupKey)
      .at(-1)!.onAppear!({} as never)
  );

  expect(screen).toHavePathnameWithParams('/groups/a?tab=members');
  const groupsRoutes = result
    .getRouterState()!
    .routes[0]!.state!.routes.find((route) => route.name === 'groups')!.state!.routes;
  expect(groupsRoutes.map((route) => route.name)).toEqual(['index', '[id]']);
  expect(groupsRoutes[1]!.key).toBe(groupKey);
  expect(groupsRoutes[1]!.params).toEqual({ id: 'a', tab: 'members' });
});
