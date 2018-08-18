import { Platform } from 'react-native';
import { Constants, Linking, WebBrowser } from 'expo';

import { waitFor } from './helpers';

const validHttpUrl = 'http://expo.io/';
const validHttpsUrl = 'https://expo.io/';
const validExpUrl = 'exp://expo.io/@community/native-component-list';
const redirectingBackendUrl = 'https://backend-xxswjknyfi.now.sh/?linkingUri=';

export const name = 'Linking';

export function test(t) {
  t.describe('Linking', () => {
    t.describe('canOpenUrl', () => {
      t.it('can open exp:// URLs', async () => {
        t.expect(await Linking.canOpenURL(validExpUrl)).toBe(true);
      });

      t.it('can open its own URLs', async () => {
        t.expect(await Linking.canOpenURL(Constants.linkingUri)).toBe(true);
      });

      t.it('can open http:// URLs', async () => {
        t.expect(await Linking.canOpenURL(validHttpUrl)).toBe(true);
      });

      t.it('can open https:// URLs', async () => {
        t.expect(await Linking.canOpenURL(validHttpsUrl)).toBe(true);
      });
    });

    t.describe('addListener', () => {
      let previousInterval = 0;
      t.beforeAll(() => {
        previousInterval = t.jasmine.DEFAULT_TIMEOUT_INTERVAL;
        t.jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
      });
      t.afterAll(() => {
        t.jasmine.DEFAULT_TIMEOUT_INTERVAL = previousInterval;
      });

      if (Platform.OS === 'android') {
        // We can't run this test on iOS since iOS it fails with an exception
        // "The specified URL has an unsupported scheme. Only HTTP and HTTPS URLs are supported."
        t.it('listener gets called with a proper URL when opened from a web modal', async () => {
          let handlerCalled = false;
          // we add two pluses here so test-suite knows to ignore the deep link content (see index.js line 92)
          const testUrl = Linking.makeUrl('++message=hello');
          const handler = ({ url }) => {
            t.expect(url).toEqual(testUrl);
            handlerCalled = true;
          };
          Linking.addEventListener('url', handler);
          await WebBrowser.openBrowserAsync(testUrl);
          t.expect(handlerCalled).toBe(true);
          Linking.removeListener('url', handler);
        });

        // We can't run this test on iOS since iOS asks "whether to open this link in Expo"
        // and we can't programmatically tap "Open".
        t.it('listener gets called with a proper URL when opened from a web browser', async () => {
          let handlerCalled = false;
          const handler = ({ url }) => {
            t.expect(url).toEqual(Linking.makeUrl('++message=Redirected automatically by timer'));
            handlerCalled = true;
          };
          Linking.addEventListener('url', handler);
          await Linking.openURL(`${redirectingBackendUrl}${Linking.makeUrl('++')}`);
          await waitFor(8000);
          t.expect(handlerCalled).toBe(true);
          Linking.removeListener('url', handler);
        });
      }

      t.it('listener gets called with a proper URL when opened from a web modal', async () => {
        let handlerCalled = false;
        const handler = ({ url }) => {
          t.expect(url).toEqual(Linking.makeUrl('++message=Redirected automatically by timer'));
          handlerCalled = true;
          WebBrowser.dismissBrowser();
        };
        Linking.addEventListener('url', handler);
        await WebBrowser.openBrowserAsync(`${redirectingBackendUrl}${Linking.makeUrl('++')}`);
        await waitFor(1000);
        t.expect(handlerCalled).toBe(true);
        Linking.removeListener('url', handler);
      });

      t.it('listener gets called with a proper URL when opened with Linking.openURL', async () => {
        let handlerCalled = false;
        const handler = ({ url }) => {
          handlerCalled = true;
        };
        Linking.addEventListener('url', handler);
        await Linking.openURL(Linking.makeUrl('++'));
        await waitFor(500);
        t.expect(handlerCalled).toBe(true);
        Linking.removeListener('url', handler);
      });

      t.it('listener parses out deep link information correctly', async () => {
        let handlerCalled = false;
        const handler = ({ url }) => {
          let { path, queryParams } = Linking.parse(url);
          // ignore +'s on the front of path,
          // since there may be one or two depending on how test-suite is being served
          t.expect(path.replace(/\+/g, '')).toEqual('test/path');
          t.expect(queryParams.query).toEqual('param');
          handlerCalled = true;
        };
        Linking.addEventListener('url', handler);
        await Linking.openURL(Linking.makeUrl('++test/path?query=param'));
        await waitFor(500);
        t.expect(handlerCalled).toBe(true);
        Linking.removeListener('url', handler);
      });
    });
  });
}
