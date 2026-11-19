import { afterEach, expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { Platform, View } from 'react-native';

import { NavigationContainer } from '../../core/__tests__/__fixtures__/NavigationContainer';
import { initialState } from '../../core/__tests__/__fixtures__/renderTestState';
import { useHeaderHeight } from '../../elements';
import { getDefaultHeaderHeight } from '../../elements/Header/getDefaultHeaderHeight';
import { createNativeStackNavigator } from '../index';

jest.mock('expo-glass-effect', () => ({
  isLiquidGlassAvailable: () => true,
}));

// The native screens debug container mounts React Native's unrelated LogBox subscription UI.
jest.mock('react-native/Libraries/LogBox/LogBoxNotificationContainer', () => () => null);

afterEach(() => {
  jest.restoreAllMocks();
});

test('returns the native Liquid Glass header height on iPhone with a 62pt top inset', () => {
  jest.replaceProperty(Platform, 'OS', 'ios');

  expect(getDefaultHeaderHeight({ width: 402, height: 874 }, false, 62, true)).toBe(116);
});

test('returns the Liquid Glass header height for a modal on iPhone', () => {
  jest.replaceProperty(Platform, 'OS', 'ios');

  expect(getDefaultHeaderHeight({ width: 402, height: 874 }, true, 0, true)).toBe(70);
});

test('returns the Liquid Glass header height in landscape on iPhone', () => {
  jest.replaceProperty(Platform, 'OS', 'ios');

  expect(getDefaultHeaderHeight({ width: 874, height: 402 }, false, 0, true)).toBe(78);
});

test('native stack starts useHeaderHeight at the Liquid Glass height', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');

  let headerHeight;
  const Test = () => {
    headerHeight = useHeaderHeight();
    return <View />;
  };

  const Stack = createNativeStackNavigator();

  await render(
    <NavigationContainer initialState={initialState}>
      <Stack.Navigator>
        <Stack.Screen name="A" component={Test} />
        <Stack.Screen name="B" component={Test} />
      </Stack.Navigator>
    </NavigationContainer>
  );

  // Test safe area insets are 0, so the top spacing falls back to 10pt
  expect(headerHeight).toBe(64);
});
