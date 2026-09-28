import { View } from 'react-native';

import { renderRouter } from '../../testing-library';
import Stack from '../Stack';

jest.mock('expo-glass-effect', () => ({
  isLiquidGlassAvailable: () => true,
}));

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

it('applies Liquid Glass defaults to form sheets without overriding explicit options', () => {
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            presentation: 'formSheet',
            headerShadowVisible: true,
          }}
        />
      </Stack>
    ),
    index: () => <View />,
  });

  const props = MockedScreenStackItem.mock.calls.at(-1)![0];
  expect(props.headerConfig?.translucent).toBe(true);
  expect(props.contentStyle).toContainEqual({ backgroundColor: 'transparent' });
  expect(props.headerConfig?.hideShadow).toBe(false);
  expect(props.headerConfig?.largeTitleHideShadow).toBe(true);
});
