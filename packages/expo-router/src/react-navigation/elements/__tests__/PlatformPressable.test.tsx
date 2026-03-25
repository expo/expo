import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import { NavigationContainer } from '../../native';
import { fireEvent, render } from '@testing-library/react-native';
import { Platform, View } from 'react-native';

import { PlatformPressable } from '../PlatformPressable';

jest.useFakeTimers();

test('triggers onPress on press event', () => {
  const onPress = jest.fn();

  const { getByTestId } = render(
    <PlatformPressable onPress={onPress} testID="pressable">
      <View />
    </PlatformPressable>,
    { wrapper: NavigationContainer }
  );

  fireEvent.press(getByTestId('pressable'));

  jest.runAllTimers();

  expect(onPress).toHaveBeenCalled();
});

describe('web', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'web');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers press on left click', () => {
    const onPress = jest.fn();
    const preventDefault = jest.fn();

    const { getByTestId } = render(
      <PlatformPressable onPress={onPress} testID="pressable" href={'/'}>
        <View />
      </PlatformPressable>,
      { wrapper: NavigationContainer }
    );

    fireEvent.press(getByTestId('pressable'), {
      button: 0,
      preventDefault,
    });

    jest.runAllTimers();

    expect(preventDefault).toHaveBeenCalled();
    expect(onPress).toHaveBeenCalled();
  });

  test('ignores press non-left clicks', () => {
    const onPress = jest.fn();

    const { getByTestId } = render(
      <PlatformPressable onPress={onPress} testID="pressable" href={'/'}>
        <View />
      </PlatformPressable>,
      { wrapper: NavigationContainer }
    );

    fireEvent.press(getByTestId('pressable'), { button: 1 });

    jest.runAllTimers();

    expect(onPress).not.toHaveBeenCalled();
  });
});
