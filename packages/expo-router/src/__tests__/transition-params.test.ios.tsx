import { act, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router, useLocalSearchParams } from '../exports';
import { navigationRef } from '../global-state/navigationRef';
import { Stack } from '../layouts/Stack';
import { INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME } from '../navigationParams';
import type { NavigationState, PartialState } from '../react-navigation/native';
import { renderRouter } from '../testing-library';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
  };
});

const { ScreenStackItem } = jest.requireMock(
  'react-native-screens'
) as typeof import('react-native-screens');
const MockedScreenStackItem = ScreenStackItem as jest.MockedFunction<typeof ScreenStackItem>;

function finishEnteringActivity() {
  const props = MockedScreenStackItem.mock.calls
    .map((call) => call[0])
    .filter((props) => typeof props.screenId === 'string' && props.screenId.startsWith('activity:'))
    .at(-1);
  expect(props?.onAppear).toBeDefined();
  act(() => props!.onAppear!({} as never));
}

function activityParams() {
  let state: NavigationState | PartialState<NavigationState> | undefined =
    navigationRef.getRootState();
  while (state) {
    const route:
      | {
          params?: object;
          state?: NavigationState | PartialState<NavigationState>;
        }
      | undefined = state.routes[state.index ?? 0];
    if (!route?.state) {
      return route?.params;
    }
    state = route.state;
  }
  return undefined;
}

it.each(['before', 'after'])(
  'keeps cleared route params when the first transition ends %s the update',
  (transitionTiming) => {
    MockedScreenStackItem.mockClear();

    function Activity() {
      const { uncategorized } = useLocalSearchParams<{ uncategorized?: string }>();
      return <Text testID="filter">{uncategorized ?? 'cleared'}</Text>;
    }

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text>Home</Text>,
      activity: Activity,
      details: () => <Text>Details</Text>,
    });

    act(() =>
      router.push(`/activity?uncategorized=1&${INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME}=1`)
    );
    expect(activityParams()).toEqual({
      uncategorized: '1',
      [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: '1',
    });

    if (transitionTiming === 'before') {
      finishEnteringActivity();
      expect(activityParams()).toEqual({ uncategorized: '1' });
    }

    act(() => router.setParams({ uncategorized: undefined }));
    expect(screen.getByTestId('filter')).toHaveTextContent('cleared');
    finishEnteringActivity();
    expect(activityParams()).toEqual({ uncategorized: undefined });

    act(() => router.push('/details'));
    act(() => router.back());
    finishEnteringActivity();
    expect(screen.getByTestId('filter')).toHaveTextContent('cleared');
    expect(activityParams()).toEqual({ uncategorized: undefined });

    act(() => router.setParams({ uncategorized: '1' }));
    expect(screen.getByTestId('filter')).toHaveTextContent('1');
  }
);
