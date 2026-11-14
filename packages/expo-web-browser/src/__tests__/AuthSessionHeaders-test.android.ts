import { AppState, Linking } from 'react-native';

import ExpoWebBrowser from '../ExpoWebBrowser';
import { openAuthSessionAsync, WebBrowserResultType } from '../WebBrowser';

jest.mock('expo', () => ({ UnavailabilityError: Error }));

jest.mock('../ExpoWebBrowser', () => ({
  openBrowserAsync: jest.fn(),
  cancelPendingBrowserOpen: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  AppState: { currentState: 'active', addEventListener: jest.fn() },
  Linking: { addEventListener: jest.fn(() => ({ remove: mockRemoveRedirect })) },
  processColor: (value: unknown) => value,
}));

const startUrl = 'https://auth.example/start';
const returnUrl = 'example://callback';
const options = { additionalHeaderFields: { 'X-Test': 'example' } };
const removeAppState = jest.fn();
const mockRemoveRedirect = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(AppState.addEventListener).mockReturnValue({ remove: removeAppState });
  ExpoWebBrowser.openBrowserAsync.mockResolvedValue({ type: WebBrowserResultType.OPENED });
  ExpoWebBrowser.cancelPendingBrowserOpen.mockResolvedValue(undefined);
});

it('cancels pending validation before allowing another authentication session', async () => {
  const pendingOpen = Promise.withResolvers<{ type: WebBrowserResultType.OPENED }>();
  const cancellation = Promise.withResolvers<void>();
  ExpoWebBrowser.openBrowserAsync.mockReturnValueOnce(pendingOpen.promise);
  ExpoWebBrowser.cancelPendingBrowserOpen.mockImplementationOnce(() => {
    pendingOpen.reject(new Error('Browser opening canceled'));
    return cancellation.promise;
  });

  const first = openAuthSessionAsync(startUrl, returnUrl, options);
  jest.mocked(Linking.addEventListener).mock.calls[0]![1]({ url: returnUrl });
  await expect(openAuthSessionAsync(startUrl, returnUrl, options)).rejects.toThrow();
  expect(ExpoWebBrowser.cancelPendingBrowserOpen).toHaveBeenCalledTimes(1);
  expect(mockRemoveRedirect).not.toHaveBeenCalled();

  cancellation.resolve();
  await expect(first).resolves.toEqual({ type: 'success', url: returnUrl });
  expect(removeAppState).toHaveBeenCalledTimes(1);
  expect(mockRemoveRedirect).toHaveBeenCalledTimes(1);

  const retry = openAuthSessionAsync(startUrl, returnUrl, options);
  jest.mocked(Linking.addEventListener).mock.calls[1]![1]({ url: returnUrl });
  await expect(retry).resolves.toEqual({ type: 'success', url: returnUrl });
  expect(removeAppState).toHaveBeenCalledTimes(2);
  expect(mockRemoveRedirect).toHaveBeenCalledTimes(2);
});

it('ignores foregrounding before verification finishes and dismisses after opening', async () => {
  const pendingOpen = Promise.withResolvers<{ type: WebBrowserResultType.OPENED }>();
  ExpoWebBrowser.openBrowserAsync.mockReturnValueOnce(pendingOpen.promise);
  const auth = openAuthSessionAsync(startUrl, returnUrl, options);
  const changeState = jest.mocked(AppState.addEventListener).mock.calls[0]![1];
  changeState('background');
  changeState('active');
  pendingOpen.resolve({ type: WebBrowserResultType.OPENED });
  await new Promise<void>((resolve) => setImmediate(resolve));
  jest.mocked(Linking.addEventListener).mock.calls[0]![1]({ url: returnUrl });
  await expect(auth).resolves.toEqual({ type: 'success', url: returnUrl });

  const retry = openAuthSessionAsync(startUrl, returnUrl, options);
  await new Promise<void>((resolve) => setImmediate(resolve));
  jest.mocked(AppState.addEventListener).mock.calls[1]![1]('active');
  await expect(retry).resolves.toEqual({ type: WebBrowserResultType.DISMISS });
  expect(removeAppState).toHaveBeenCalledTimes(2);
  expect(mockRemoveRedirect).toHaveBeenCalledTimes(2);
});
