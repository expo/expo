import ExpoWebBrowser from '../ExpoWebBrowser';
import { openAuthSessionAsync } from '../WebBrowser';

jest.mock('../ExpoWebBrowser', () => ({ openAuthSessionAsync: jest.fn() }));

it('rejects unsupported authentication headers before opening a window', async () => {
  await expect(
    openAuthSessionAsync('https://auth.example/start', 'https://app.example/callback', {
      additionalHeaderFields: { 'X-Test': 'example' },
    })
  ).rejects.toMatchObject({ code: 'ERR_UNAVAILABLE' });
  expect(ExpoWebBrowser.openAuthSessionAsync).not.toHaveBeenCalled();
});
