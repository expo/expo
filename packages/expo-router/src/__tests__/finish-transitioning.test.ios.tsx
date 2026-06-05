import { act, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
import { Text } from 'react-native';
import type { NativeSyntheticEvent, TargetedEvent } from 'react-native';

import Stack from '../layouts/Stack';
import type { ParamListBase } from '../react-navigation/core';
import type { NativeStackNavigationProp } from '../react-navigation/native-stack';
import { renderRouter } from '../testing-library';
import { useNavigation } from '../useNavigation';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStack: jest.fn((props) => <actualScreens.ScreenStack {...props} />),
  };
});

const { ScreenStack } = jest.requireMock(
  'react-native-screens'
) as typeof import('react-native-screens');
const MockedScreenStack = ScreenStack as jest.MockedFunction<typeof ScreenStack>;

it('emits finishTransitioning to navigator listeners when the stack settles', () => {
  const events: string[] = [];

  function HomeScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
    useEffect(
      () =>
        navigation.addListener('finishTransitioning', () => {
          events.push('finishTransitioning');
        }),
      [navigation]
    );
    return <Text testID="home">Home</Text>;
  }

  renderRouter({
    _layout: () => <Stack />,
    index: HomeScreen,
  });

  expect(screen.getByTestId('home')).toBeVisible();

  const { onFinishTransitioning } = MockedScreenStack.mock.calls.at(-1)![0];
  expect(onFinishTransitioning).toBeDefined();

  act(() => {
    onFinishTransitioning!({ nativeEvent: { target: 1 } } as NativeSyntheticEvent<TargetedEvent>);
  });

  expect(events).toEqual(['finishTransitioning']);
});
