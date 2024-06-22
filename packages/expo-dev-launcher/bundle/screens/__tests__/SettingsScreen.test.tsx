import * as React from 'react';

import { copyToClipboardAsync } from '../../native-modules/DevLauncherInternal';
import {
  DevMenuPreferencesType,
  setMenuPreferencesAsync,
} from '../../native-modules/DevMenuPreferences';
import { render, fireEvent, act } from '../../test-utils';
import { SettingsScreen } from '../SettingsScreen';

const mockSetMenuPreferencesAsync = setMenuPreferencesAsync as jest.Mock;

describe('<SettingsScreen />', () => {
  afterEach(() => {
    mockSetMenuPreferencesAsync.mockClear();
  });

  test('shows the correct settings on mount 1', async () => {
    const testPreferences: DevMenuPreferencesType = {
      motionGestureEnabled: true,
      touchGestureEnabled: true,
      showsAtLaunch: false,
    };

    const { findByLabelText, findAllByRole } = render(<SettingsScreen />, {
      initialAppProviderProps: { initialDevMenuPreferences: testPreferences },
    });

    const showsAtLaunchButton = await findByLabelText(/toggle showing menu/i);
    expect(showsAtLaunchButton.props.value).toBe(testPreferences.showsAtLaunch);

    const activeCheckmarks = await findAllByRole('button', { checked: true });
    expect(activeCheckmarks.length).toEqual(2);
  });

  test('shows the correct settings on mount 2', async () => {
    const testPreferences: DevMenuPreferencesType = {
      motionGestureEnabled: true,
      touchGestureEnabled: false,
      showsAtLaunch: true,
    };

    const { findByLabelText, findAllByRole } = render(<SettingsScreen />, {
      initialAppProviderProps: { initialDevMenuPreferences: testPreferences },
    });

    const showsAtLaunchButton = await findByLabelText(/toggle showing menu/i);
    expect(showsAtLaunchButton.props.value).toBe(testPreferences.showsAtLaunch);

    const activeCheckmarks = await findAllByRole('button', { checked: true });
    expect(activeCheckmarks.length).toEqual(1);
  });

  test('toggling shake device', async () => {
    const { findByText } = render(<SettingsScreen />);

    const toggle = await findByText(/shake device/i);

    await act(async () => {
      fireEvent.press(toggle);
    });

    expect(setMenuPreferencesAsync).toHaveBeenCalledTimes(1);
    expect(setMenuPreferencesAsync).toHaveBeenLastCalledWith({ motionGestureEnabled: true });

    await act(async () => {
      fireEvent.press(toggle);
    });

    expect(setMenuPreferencesAsync).toHaveBeenCalledTimes(2);
    expect(setMenuPreferencesAsync).toHaveBeenLastCalledWith({ motionGestureEnabled: false });
  });

  test('toggling gesture press', async () => {
    const { findByText } = render(<SettingsScreen />);

    const toggle = await findByText(/three-finger long-press/i);

    await act(async () => {
      fireEvent.press(toggle);
    });

    expect(setMenuPreferencesAsync).toHaveBeenCalledTimes(1);
    expect(setMenuPreferencesAsync).toHaveBeenLastCalledWith({ touchGestureEnabled: true });

    await act(async () => {
      fireEvent.press(toggle);
    });

    expect(setMenuPreferencesAsync).toHaveBeenCalledTimes(2);
    expect(setMenuPreferencesAsync).toHaveBeenLastCalledWith({ touchGestureEnabled: false });
  });

  test('toggling show menu at launch press', async () => {
    const { findByLabelText } = render(<SettingsScreen />);

    const toggle = await findByLabelText(/toggle showing menu at launch/i);

    await act(async () => {
      fireEvent.press(toggle);
    });

    expect(setMenuPreferencesAsync).toHaveBeenCalledTimes(1);
    expect(setMenuPreferencesAsync).toHaveBeenLastCalledWith({ showsAtLaunch: true });

    await act(async () => {
      fireEvent.press(toggle);
    });

    expect(setMenuPreferencesAsync).toHaveBeenCalledTimes(2);
    expect(setMenuPreferencesAsync).toHaveBeenLastCalledWith({ showsAtLaunch: false });
  });

  test('displays runtime version when available', async () => {
    const fakeRTV = 'TESTING FAKE RTV';
    const fakeSDKVersion = 'TESTING FAKE SDKVersion';

    const { findByText, queryByText } = render(<SettingsScreen />, {
      initialAppProviderProps: {
        initialBuildInfo: {
          runtimeVersion: fakeRTV,
          sdkVersion: fakeSDKVersion,
        },
      },
    });

    await findByText(fakeRTV);
    // should not be visible if RTV is there
    expect(queryByText(fakeSDKVersion)).toBe(null);
  });

  test('displays sdk version when rtv is not available', () => {
    const fakeSDKVersion = 'TESTING FAKE SDKVersion';

    const { getByText, queryByText } = render(<SettingsScreen />, {
      initialAppProviderProps: {
        initialBuildInfo: {
          sdkVersion: fakeSDKVersion,
        },
      },
    });

    expect(queryByText(/runtime version/i)).toBe(null);
    getByText(fakeSDKVersion);
  });

  test('copies app info to clipboard', async () => {
    const fakeRTV = 'TESTING FAKE RTV';
    const fakeSDKVersion = 'TESTING FAKE SDKVersion';

    const fakeAppInfo = {
      runtimeVersion: fakeRTV,
      sdkVersion: fakeSDKVersion,
    };

    const { findByText } = render(<SettingsScreen />, {
      initialAppProviderProps: {
        initialBuildInfo: fakeAppInfo,
      },
    });

    expect(copyToClipboardAsync).not.toHaveBeenCalled();

    const button = await findByText(/tap to copy all/i);

    await act(async () => {
      fireEvent.press(button);
    });

    expect(copyToClipboardAsync).toHaveBeenCalled();
    expect(copyToClipboardAsync).toHaveBeenLastCalledWith(
      expect.stringContaining(fakeAppInfo.runtimeVersion)
    );
    expect(copyToClipboardAsync).toHaveBeenLastCalledWith(
      expect.stringContaining(fakeAppInfo.sdkVersion)
    );
  });
});
