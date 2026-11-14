import { mockLinking, unmockAllProperties } from 'jest-expo';

import ExpoWebBrowser from '../ExpoWebBrowser';
import { openAuthSessionAsync } from '../WebBrowser';

afterEach(() => {
  unmockAllProperties();
});

it('supports authentication headers with the bundled native module mock', async () => {
  const emit = mockLinking();
  ExpoWebBrowser.openBrowserAsync.mockResolvedValue({ type: 'opened' });
  const auth = openAuthSessionAsync('https://auth.example/start', 'example://callback', {
    additionalHeaderFields: { 'X-Test': 'example' },
  });
  emit('url', { url: 'example://callback' });
  await expect(auth).resolves.toEqual({ type: 'success', url: 'example://callback' });
  expect(ExpoWebBrowser.cancelPendingBrowserOpen).toHaveBeenCalledTimes(1);
});
