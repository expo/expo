import * as React from 'react';

import {
  BuildInfo,
  getBuildInfoAsync,
  toggleDebugRemoteJSAsync,
  toggleElementInspectorAsync,
  toggleFastRefreshAsync,
  togglePerformanceMonitorAsync,
  copyToClipboardAsync,
  navigateToLauncherAsync,
  reloadAsync,
} from '../../native-modules/DevMenu';
import { render, waitFor, fireEvent, act } from '../../test-utils';
import { Main } from '../Main';

const mockGetBuildInfoAsync = getBuildInfoAsync as jest.Mock;
const mockToggleDebugRemoteJSAsync = toggleDebugRemoteJSAsync as jest.Mock;
const mockToggleElementInspectorAsync = toggleElementInspectorAsync as jest.Mock;
const mockToggleFastRefreshAsync = toggleFastRefreshAsync as jest.Mock;
const mockTogglePerformanceMonitorAsync = togglePerformanceMonitorAsync as jest.Mock;
const mockCopyToClipboardAsync = copyToClipboardAsync as jest.Mock;
const mockNavigateToLauncherAsync = navigateToLauncherAsync as jest.Mock;
const mockReloadAsync = reloadAsync as jest.Mock;

const mockFns: jest.Mock[] = [
  mockGetBuildInfoAsync,
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
    const fakeBuildInfo: BuildInfo = {
      appName: 'testing',
      appVersion: '123',
      appIcon: 'hello',
      hostUrl: '321',
      sdkVersion: '500',
      runtimeVersion: '10',
    };

    mockGetBuildInfoAsync.mockClear();
    mockGetBuildInfoAsync.mockResolvedValueOnce(fakeBuildInfo);

    const { getByText, queryByText } = render(<Main />);

    expect(getBuildInfoAsync).toHaveBeenCalledTimes(1);

    expect(queryByText(fakeBuildInfo.appName)).toBe(null);
    expect(queryByText(fakeBuildInfo.appVersion)).toBe(null);
    expect(queryByText(fakeBuildInfo.hostUrl)).toBe(null);
    expect(queryByText(fakeBuildInfo.runtimeVersion)).toBe(null);

    await waitFor(() => getByText(/go home/i));

    expect(queryByText(fakeBuildInfo.appName)).not.toBe(null);
    expect(queryByText(fakeBuildInfo.appVersion)).not.toBe(null);
    expect(queryByText(fakeBuildInfo.hostUrl)).not.toBe(null);
    expect(queryByText(fakeBuildInfo.runtimeVersion)).not.toBe(null);
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
    const fakeBuildInfo: BuildInfo = {
      appName: 'testing',
      appVersion: '123',
      appIcon: 'hello',
      hostUrl: '321',
      sdkVersion: '500',
      runtimeVersion: '10',
    };

    mockGetBuildInfoAsync.mockClear();
    mockGetBuildInfoAsync.mockResolvedValueOnce(fakeBuildInfo);

    const { getByText } = render(<Main />);
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

    expect(copyToClipboardAsync).toHaveBeenLastCalledWith(fakeBuildInfo.hostUrl);
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
