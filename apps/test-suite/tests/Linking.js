import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { LogBox, Platform } from 'react-native';

import { waitFor } from './helpers';

const validHttpUrl = 'http://exp.host/';
const validHttpsUrl = 'https://exp.host/';
const validExpUrl = 'exp://exp.host/@community/native-component-list';
const redirectingBackendUrl = 'https://backend-xxswjknyfi.now.sh/?linkingUri=';

// Because the root navigator of test-suite doesn't have a matching screen for URL, it will warn.
// This is expected as all tests are wrapped in `screens/TestScreen.js`, and not defined as separate screens.
LogBox.ignoreLogs([
  'navigation state parsed from the URL contains routes not present in the root navigator',
]);

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
          const testUrl = Linking.makeUrl('++message=hello');
          const handler = ({ url }) => {
            t.expect(url).toEqual(testUrl);
            handlerCalled = true;
          };
          Linking.addEventListener('url', handler);
          await WebBrowser.openBrowserAsync(testUrl);
          await waitFor(8000);
          t.expect(handlerCalled).toBe(true);
          Linking.removeEventListener('url', handler);
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
          Linking.removeEventListener('url', handler);
        });
      }

      t.it('listener gets called with a proper URL when opened from a web modal', async () => {
        let handlerCalled = false;
        const handler = ({ url }) => {
          t.expect(url).toEqual(Linking.makeUrl('++message=Redirected automatically by timer'));
          handlerCalled = true;
          if (Platform.OS === 'ios') WebBrowser.dismissBrowser();
        };
        Linking.addEventListener('url', handler);
        await WebBrowser.openBrowserAsync(`${redirectingBackendUrl}${Linking.makeUrl('++')}`);
        await waitFor(1000);
        t.expect(handlerCalled).toBe(true);
        Linking.removeEventListener('url', handler);
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
        Linking.removeEventListener('url', handler);
      });

      t.it('listener parses out deep link information correctly', async () => {
        let handlerCalled = false;
        const handler = ({ url }) => {
          const { path, queryParams } = Linking.parse(url);
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
        Linking.removeEventListener('url', handler);
      });
    });
  });
}
