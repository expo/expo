import { act } from '@testing-library/react-native';
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

it('disables animation only for the first stack screen reached across tabs', () => {
  const result = renderRouter(routes, { initialUrl: '/first' });

  act(() => router.push('/second/details'));

  expect(screen).toHavePathname('/second/details');
  expect(latestStackItemProps('details')?.stackAnimation).toBe('none');

  const tabsState = result.getRouterState()!.routes[0]!.state!;
  const secondTab = tabsState.routes.find((route) => route.name === 'second')!;
  const details = secondTab.state!.routes.find((route) => route.name === 'details')!;
  expect(details.params).toHaveProperty(INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME, true);

  act(() => latestStackItemProps('details')!.onAppear!({} as never));

  const updatedTabsState = result.getRouterState()!.routes[0]!.state!;
  const updatedSecondTab = updatedTabsState.routes.find((route) => route.name === 'second')!;
  const updatedDetails = updatedSecondTab.state!.routes.find((route) => route.name === 'details')!;
  expect(updatedDetails.params).not.toHaveProperty(INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME);

  MockedScreenStackItem.mockClear();
  act(() => router.push('/second/final'));

  expect(screen).toHavePathname('/second/final');
  expect(latestStackItemProps('final')?.stackAnimation).toBeUndefined();
});

it('keeps the default animation when pushing within the focused tab', () => {
  renderRouter(routes, { initialUrl: '/second' });

  act(() => router.push('/second/details'));

  expect(screen).toHavePathname('/second/details');
  expect(latestStackItemProps('details')?.stackAnimation).toBeUndefined();
});
