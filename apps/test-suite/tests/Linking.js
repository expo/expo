import { Platform } from 'react-native';
import { Linking } from 'expo';

import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

import { waitFor } from './helpers';

const validHttpUrl = 'http://expo.io/';
const validHttpsUrl = 'https://expo.io/';
const validExpUrl = 'exp://expo.io/@community/native-component-list';
const redirectingBackendUrl = 'https://backend-xxswjknyfi.now.sh/?linkingUri=';

export const name = 'Linking';

export function canRunAsync({ isAutomated }) {
  // Fails to redirect because of malformed URL in published version with release channel parameter
  return !isAutomated;
}

export function test({ describe, beforeAll, afterAll, afterEach, it, expect, jasmine, ...t }) {
  describe('canOpenUrl', () => {
    it('can open exp:// URLs', async () => {
      expect(await Linking.canOpenURL(validExpUrl)).toBe(true);
    });

    it('can open its own URLs', async () => {
      expect(await Linking.canOpenURL(Constants.linkingUri)).toBe(true);
    });

    it('can open http:// URLs', async () => {
      expect(await Linking.canOpenURL(validHttpUrl)).toBe(true);
    });

    it('can open https:// URLs', async () => {
      expect(await Linking.canOpenURL(validHttpsUrl)).toBe(true);
    });
  });

  describe('addListener', () => {
    let previousInterval = 0;
    beforeAll(() => {
      previousInterval = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    });
    afterAll(() => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = previousInterval;
    });

    if (Platform.OS === 'android') {
      // We can't run this test on iOS since iOS it fails with an exception
      // "The specified URL has an unsupported scheme. Only HTTP and HTTPS URLs are supported."
      it('listener gets called with a proper URL when opened from a web modal', async () => {
        let handlerCalled = false;
        const testUrl = Linking.makeUrl('++message=hello');
        const handler = ({ url }) => {
          expect(url).toEqual(testUrl);
          handlerCalled = true;
        };
        Linking.addEventListener('url', handler);
        await WebBrowser.openBrowserAsync(testUrl);
        expect(handlerCalled).toBe(true);
        Linking.removeListener('url', handler);
      });

      // We can't run this test on iOS since iOS asks "whether to open this link in Expo"
      // and we can't programmatically tap "Open".
      it('listener gets called with a proper URL when opened from a web browser', async () => {
        let handlerCalled = false;
        const handler = ({ url }) => {
          expect(url).toEqual(Linking.makeUrl('++message=Redirected automatically by timer'));
          handlerCalled = true;
        };
        Linking.addEventListener('url', handler);
        await Linking.openURL(`${redirectingBackendUrl}${Linking.makeUrl('++')}`);
        await waitFor(8000);
        expect(handlerCalled).toBe(true);
        Linking.removeListener('url', handler);
      });
    }

    it('listener gets called with a proper URL when opened from a web modal', async () => {
      let handlerCalled = false;
      const handler = ({ url }) => {
        expect(url).toEqual(Linking.makeUrl('++message=Redirected automatically by timer'));
        handlerCalled = true;
        if (Platform.OS === 'ios') WebBrowser.dismissBrowser();
      };
      Linking.addEventListener('url', handler);
      await WebBrowser.openBrowserAsync(`${redirectingBackendUrl}${Linking.makeUrl('++')}`);
      await waitFor(1000);
      expect(handlerCalled).toBe(true);
      Linking.removeListener('url', handler);
    });

    it('listener gets called with a proper URL when opened with Linking.openURL', async () => {
      let handlerCalled = false;
      const handler = ({ url }) => {
        handlerCalled = true;
      };
      Linking.addEventListener('url', handler);
      await Linking.openURL(Linking.makeUrl('++'));
      await waitFor(500);
      expect(handlerCalled).toBe(true);
      Linking.removeListener('url', handler);
    });

    it('listener parses out deep link information correctly', async () => {
      let handlerCalled = false;
      const handler = ({ url }) => {
        let { path, queryParams } = Linking.parse(url);
        // ignore +'s on the front of path,
        // since there may be one or two depending on how test-suite is being served
        expect(path.replace(/\+/g, '')).toEqual('test/path');
        expect(queryParams.query).toEqual('param');
        handlerCalled = true;
      };
      Linking.addEventListener('url', handler);
      await Linking.openURL(Linking.makeUrl('++test/path?query=param'));
      await waitFor(500);
      expect(handlerCalled).toBe(true);
      Linking.removeListener('url', handler);
    });
  });
}
