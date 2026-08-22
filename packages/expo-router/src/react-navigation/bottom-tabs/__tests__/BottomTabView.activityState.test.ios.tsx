import { userEvent } from '@testing-library/react-native';

import { Tabs } from '../../../layouts/Tabs';
import { renderRouter, screen } from '../../../testing-library';
import { Text } from '../../elements';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    Screen: jest.fn((props) => <actualScreens.Screen {...props} />),
  };
});

const { Screen: MockedScreen } = jest.requireMock('react-native-screens') as unknown as {
  Screen: jest.Mock;
};

beforeEach(() => {
  MockedScreen.mockClear();
});

function activityStates() {
  return MockedScreen.mock.calls.map((call) => call[0].activityState);
}

// `activityState` decides whether react-native-screens keeps a screen attached. When it comes from
// an `Animated.Value`, the native driver owns the prop, and an interrupted transition can leave a
// focused screen detached, so the tab renders blank. See https://github.com/expo/expo/issues/39514
test('does not derive the screen activity state from the transition animation', async () => {
  renderRouter({
    _layout: () => (
      <Tabs screenOptions={{ animation: 'shift' }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    index: () => <Text>Screen index</Text>,
    second: () => <Text>Screen second</Text>,
  });

  expect(MockedScreen).toHaveBeenCalled();
  expect(activityStates().every((state) => typeof state === 'number')).toBe(true);

  MockedScreen.mockClear();
  await userEvent.press(screen.getByRole('button', { name: 'second, tab, 2 of 2' }));

  expect(MockedScreen).toHaveBeenCalled();
  expect(activityStates().every((state) => typeof state === 'number')).toBe(true);
});
