import * as React from 'react';

import { DevLauncher } from '../../native-modules/DevLauncher';
import {
  AppInfo,
  toggleDebugRemoteJSAsync,
  toggleElementInspectorAsync,
  toggleFastRefreshAsync,
  togglePerformanceMonitorAsync,
  copyToClipboardAsync,
  reloadAsync,
} from '../../native-modules/DevMenu';
import { render, waitFor, fireEvent, act } from '../../test-utils';
import { Main } from '../Main';

const { navigateToLauncherAsync } = DevLauncher;

const mockToggleDebugRemoteJSAsync = toggleDebugRemoteJSAsync as jest.Mock;
const mockToggleElementInspectorAsync = toggleElementInspectorAsync as jest.Mock;
const mockToggleFastRefreshAsync = toggleFastRefreshAsync as jest.Mock;
const mockTogglePerformanceMonitorAsync = togglePerformanceMonitorAsync as jest.Mock;
const mockCopyToClipboardAsync = copyToClipboardAsync as jest.Mock;
const mockNavigateToLauncherAsync = navigateToLauncherAsync as jest.Mock;
const mockReloadAsync = reloadAsync as jest.Mock;

const mockFns: jest.Mock[] = [
  mockToggleDebugRemoteJSAsync,
  mockToggleElementInspectorAsync,
  mockToggleFastRefreshAsync,
  mockTogglePerformanceMonitorAsync,
  mockCopyToClipboardAsync,
  mockNavigateToLauncherAsync,
  mockReloadAsync,
];

describe('<Main />', () => {
  afterEach(() => {
    mockFns.forEach((fn) => fn.mockClear());
  });

  test('renders', async () => {
    const { getByText } = render(<Main />, { initialAppProviderProps: {} });
    await waitFor(() => getByText(/go home/i));
  });

  test('renders build info from dev menu', async () => {
    const fakeAppInfo: AppInfo = {
      appName: 'testing',
      appVersion: '123',
      appIcon: 'hello',
      hostUrl: '321',
      sdkVersion: '500',
      runtimeVersion: '10',
    };

    const { getByText, queryByText } = render(<Main />, {
      initialAppProviderProps: { appInfo: fakeAppInfo },
    });

    await waitFor(() => getByText(/go home/i));

    expect(queryByText(fakeAppInfo.appName)).not.toBe(null);
    expect(queryByText(fakeAppInfo.appVersion)).not.toBe(null);
    expect(queryByText(fakeAppInfo.hostUrl)).not.toBe(null);
    expect(queryByText(fakeAppInfo.runtimeVersion)).not.toBe(null);
  });

  test('hooked up to devsettings fns', async () => {
    const { getByText, getByTestId } = render(<Main />);
    await waitFor(() => getByText(/go home/i));

    expect(togglePerformanceMonitorAsync).toHaveBeenCalledTimes(0);
    await act(async () => fireEvent.press(getByText(/toggle performance monitor/i)));
    expect(togglePerformanceMonitorAsync).toHaveBeenCalledTimes(1);

    expect(toggleElementInspectorAsync).toHaveBeenCalledTimes(0);
    await act(async () => fireEvent.press(getByText(/toggle element inspector/i)));
    expect(toggleElementInspectorAsync).toHaveBeenCalledTimes(1);

    expect(toggleDebugRemoteJSAsync).toHaveBeenCalledTimes(0);
    await act(async () => fireEvent.press(getByTestId('local-dev-tools')));
    expect(toggleDebugRemoteJSAsync).toHaveBeenCalledTimes(1);

    expect(toggleFastRefreshAsync).toHaveBeenCalledTimes(0);
    await act(async () => fireEvent.press(getByTestId('fast-refresh')));
    expect(toggleFastRefreshAsync).toHaveBeenCalledTimes(1);
  });

  test('copy text functions', async () => {
    const fakeAppInfo: AppInfo = {
      appName: 'testing',
      appVersion: '123',
      appIcon: 'hello',
      hostUrl: '321',
      sdkVersion: '500',
      runtimeVersion: '10',
    };

    const { getByText } = render(<Main />, {
      initialAppProviderProps: { appInfo: fakeAppInfo },
    });
    await waitFor(() => getByText(/go home/i));

    expect(copyToClipboardAsync).toHaveBeenCalledTimes(0);
    await act(async () => fireEvent.press(getByText(/copy all/i)));
    expect(copyToClipboardAsync).toHaveBeenCalledTimes(1);

    expect(copyToClipboardAsync).toHaveBeenLastCalledWith(expect.stringContaining('sdkVersion'));
    expect(copyToClipboardAsync).toHaveBeenLastCalledWith(expect.stringContaining('appVersion'));
    expect(copyToClipboardAsync).toHaveBeenLastCalledWith(expect.stringContaining('appName'));
    expect(copyToClipboardAsync).toHaveBeenLastCalledWith(
      expect.stringContaining('runtimeVersion')
    );

    mockCopyToClipboardAsync.mockClear();

    expect(copyToClipboardAsync).toHaveBeenCalledTimes(0);
    await act(async () => fireEvent.press(getByText(/copy link/i)));
    expect(copyToClipboardAsync).toHaveBeenCalledTimes(1);

    expect(copyToClipboardAsync).toHaveBeenLastCalledWith(fakeAppInfo.hostUrl);
  });

  test('return to dev launcher and reload', async () => {
    const { getByText } = render(<Main />);
    await waitFor(() => getByText(/go home/i));

    expect(navigateToLauncherAsync).toHaveBeenCalledTimes(0);
    await act(async () => fireEvent.press(getByText(/go home/i)));
    expect(navigateToLauncherAsync).toHaveBeenCalledTimes(1);

    expect(reloadAsync).toHaveBeenCalledTimes(0);
    await act(async () => fireEvent.press(getByText(/reload/i)));
    expect(reloadAsync).toHaveBeenCalledTimes(1);
  });
});
