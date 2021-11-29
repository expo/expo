import * as React from 'react';

import { DevMenuSettingsType, setSettingsAsync } from '../../native-modules/DevMenuInternal';
import { render, fireEvent, waitFor, act } from '../../test-utils';
import { SettingsScreen } from '../SettingsScreen';

const mockSetSettingsAsync = setSettingsAsync as jest.Mock;

describe('<SettingsScreen />', () => {
  afterEach(() => {
    mockSetSettingsAsync.mockClear();
  });

  test('shows the correct settings on mount 1', async () => {
    const testSettings: DevMenuSettingsType = {
      motionGestureEnabled: true,
      touchGestureEnabled: true,
      showsAtLaunch: false,
    };

    const { getByA11yLabel, findAllByA11yState } = render(<SettingsScreen />, {
      initialAppProviderProps: { initialDevMenuSettings: testSettings },
    });

    const showsAtLaunchButton = getByA11yLabel(/toggle showing menu/i);
    expect(showsAtLaunchButton.props.value).toBe(testSettings.showsAtLaunch);

    const activeCheckmarks = await findAllByA11yState({ checked: true });
    expect(activeCheckmarks.length).toEqual(2);
  });

  test('shows the correct settings on mount 2', async () => {
    const testSettings: DevMenuSettingsType = {
      motionGestureEnabled: true,
      touchGestureEnabled: false,
      showsAtLaunch: true,
    };

    const { getByA11yLabel, findAllByA11yState } = render(<SettingsScreen />, {
      initialAppProviderProps: { initialDevMenuSettings: testSettings },
    });

    const showsAtLaunchButton = getByA11yLabel(/toggle showing menu/i);
    expect(showsAtLaunchButton.props.value).toBe(testSettings.showsAtLaunch);

    const activeCheckmarks = await findAllByA11yState({ checked: true });
    expect(activeCheckmarks.length).toEqual(1);
  });

  test('toggling shake device', async () => {
    const { getByText } = render(<SettingsScreen />);

    await act(async () => {
      const toggle = getByText(/shake device/i);
      fireEvent.press(toggle);
      expect(setSettingsAsync).toHaveBeenCalledTimes(1);
      expect(setSettingsAsync).toHaveBeenLastCalledWith({ motionGestureEnabled: true });
    });

    await act(async () => {
      const toggle = getByText(/shake device/i);
      fireEvent.press(toggle);

      expect(setSettingsAsync).toHaveBeenCalledTimes(2);
      expect(setSettingsAsync).toHaveBeenLastCalledWith({ motionGestureEnabled: false });
    });
  });

  test('toggling gesture press', async () => {
    const { getByText } = render(<SettingsScreen />);

    await act(async () => {
      const toggle = getByText(/three-finger long-press/i);
      fireEvent.press(toggle);
      expect(setSettingsAsync).toHaveBeenCalledTimes(1);
      expect(setSettingsAsync).toHaveBeenLastCalledWith({ touchGestureEnabled: true });
    });

    await act(async () => {
      const toggle = getByText(/three-finger long-press/i);
      fireEvent.press(toggle);

      expect(setSettingsAsync).toHaveBeenCalledTimes(2);
      expect(setSettingsAsync).toHaveBeenLastCalledWith({ touchGestureEnabled: false });
    });
  });

  test('toggling show menu at launch press', async () => {
    const { getByA11yLabel } = render(<SettingsScreen />);

    await act(async () => {
      const toggle = getByA11yLabel(/toggle showing menu at launch/i);
      fireEvent.press(toggle);
      expect(setSettingsAsync).toHaveBeenCalledTimes(1);
      expect(setSettingsAsync).toHaveBeenLastCalledWith({ showsAtLaunch: true });
    });

    await act(async () => {
      const toggle = getByA11yLabel(/toggle showing menu at launch/i);
      fireEvent.press(toggle);

      expect(setSettingsAsync).toHaveBeenCalledTimes(2);
      expect(setSettingsAsync).toHaveBeenLastCalledWith({ showsAtLaunch: false });
    });
  });

  test.todo('displays correct version and run time version');
  test.todo('copies versions to clipboard');
});
