import { Linking } from 'react-native';

import {
  defaultOriginWhitelist,
  createOnShouldStartLoadWithRequest,
} from '../WebViewShared';

Linking.openURL.mockResolvedValue(undefined);
Linking.canOpenURL.mockResolvedValue(true);

// The tests that call createOnShouldStartLoadWithRequest will cause a promise
// to get kicked off (by calling the mocked `Linking.canOpenURL`) that the tests
// _need_ to get run to completion _before_ doing any `expect`ing. The reason
// is: once that promise is resolved another function should get run which will
// call `Linking.openURL`, and we want to test that.
//
// Normally we would probably do something like `await
// createShouldStartLoadWithRequest(...)` in the tests, but that doesn't work
// here because the promise that gets kicked off is not returned (because
// non-test code doesn't need to know about it).
//
// The tests thus need a way to "flush any pending promises" (to make sure
// pending promises run to completion) before doing any `expect`ing. `jest`
// doesn't provide a way to do this out of the box, but we can use this function
// to do it.
//
// See this issue for more discussion: https://github.com/facebook/jest/issues/2157
function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('WebViewShared', () => {
  test('exports defaultOriginWhitelist', () => {
    expect(defaultOriginWhitelist).toMatchSnapshot();
  });

  describe('createOnShouldStartLoadWithRequest', () => {
    const alwaysTrueOnShouldStartLoadWithRequest = (nativeEvent) => {
      return true;
    };

    const alwaysFalseOnShouldStartLoadWithRequest = (nativeEvent) => {
      return false;
    };

    const loadRequest = jest.fn();

    test('loadRequest is called without onShouldStartLoadWithRequest override', async () => {
      const onShouldStartLoadWithRequest = createOnShouldStartLoadWithRequest(
        loadRequest,
        defaultOriginWhitelist
      );

      onShouldStartLoadWithRequest({
        nativeEvent: { url: 'https://www.example.com/', lockIdentifier: 1 },
      });

      await flushPromises();

      expect(Linking.openURL).toHaveBeenCalledTimes(0);
      expect(loadRequest).toHaveBeenCalledWith(
        true,
        'https://www.example.com/',
        1
      );
    });

    test('Linking.openURL is called without onShouldStartLoadWithRequest override', async () => {
      const onShouldStartLoadWithRequest = createOnShouldStartLoadWithRequest(
        loadRequest,
        defaultOriginWhitelist
      );

      onShouldStartLoadWithRequest({
        nativeEvent: { url: 'invalid://example.com/', lockIdentifier: 2 },
      });

      await flushPromises();

      expect(Linking.openURL).toHaveBeenCalledWith('invalid://example.com/');
      expect(loadRequest).toHaveBeenCalledWith(
        false,
        'invalid://example.com/',
        2
      );
    });

    test('loadRequest with true onShouldStartLoadWithRequest override is called', async () => {
      const onShouldStartLoadWithRequest = createOnShouldStartLoadWithRequest(
        loadRequest,
        defaultOriginWhitelist,
        alwaysTrueOnShouldStartLoadWithRequest
      );

      onShouldStartLoadWithRequest({
        nativeEvent: { url: 'https://www.example.com/', lockIdentifier: 1 },
      });

      await flushPromises();

      expect(Linking.openURL).toHaveBeenCalledTimes(0);
      expect(loadRequest).toHaveBeenLastCalledWith(
        true,
        'https://www.example.com/',
        1
      );
    });

    test('Linking.openURL with true onShouldStartLoadWithRequest override is called for links not passing the whitelist', async () => {
      const onShouldStartLoadWithRequest = createOnShouldStartLoadWithRequest(
        loadRequest,
        defaultOriginWhitelist,
        alwaysTrueOnShouldStartLoadWithRequest
      );

      onShouldStartLoadWithRequest({
        nativeEvent: { url: 'invalid://example.com/', lockIdentifier: 1 },
      });

      await flushPromises();

      expect(Linking.openURL).toHaveBeenLastCalledWith(
        'invalid://example.com/'
      );
      // We don't expect the URL to have been loaded in the WebView because it
      // is not in the origin whitelist
      expect(loadRequest).toHaveBeenLastCalledWith(
        false,
        'invalid://example.com/',
        1
      );
    });

    test('loadRequest with false onShouldStartLoadWithRequest override is called', async () => {
      const onShouldStartLoadWithRequest = createOnShouldStartLoadWithRequest(
        loadRequest,
        defaultOriginWhitelist,
        alwaysFalseOnShouldStartLoadWithRequest
      );

      onShouldStartLoadWithRequest({
        nativeEvent: { url: 'https://www.example.com/', lockIdentifier: 1 },
      });

      await flushPromises();

      expect(Linking.openURL).toHaveBeenCalledTimes(0);
      expect(loadRequest).toHaveBeenLastCalledWith(
        false,
        'https://www.example.com/',
        1
      );
    });

    test('loadRequest with limited whitelist', async () => {
      const onShouldStartLoadWithRequest = createOnShouldStartLoadWithRequest(
        loadRequest,
        ['https://*']
      );

      onShouldStartLoadWithRequest({
        nativeEvent: { url: 'https://www.example.com/', lockIdentifier: 1 },
      });

      await flushPromises();

      expect(Linking.openURL).toHaveBeenCalledTimes(0);
      expect(loadRequest).toHaveBeenLastCalledWith(
        true,
        'https://www.example.com/',
        1
      );

      onShouldStartLoadWithRequest({
        nativeEvent: { url: 'http://insecure.com/', lockIdentifier: 2 },
      });

      await flushPromises();

      expect(Linking.openURL).toHaveBeenLastCalledWith('http://insecure.com/');
      expect(loadRequest).toHaveBeenLastCalledWith(
        false,
        'http://insecure.com/',
        2
      );

      onShouldStartLoadWithRequest({
        nativeEvent: { url: 'git+https://insecure.com/', lockIdentifier: 3 },
      });

      await flushPromises();

      expect(Linking.openURL).toHaveBeenLastCalledWith(
        'git+https://insecure.com/'
      );
      expect(loadRequest).toHaveBeenLastCalledWith(
        false,
        'git+https://insecure.com/',
        3
      );

      onShouldStartLoadWithRequest({
        nativeEvent: { url: 'fakehttps://insecure.com/', lockIdentifier: 4 },
      });

      await flushPromises();

      expect(Linking.openURL).toHaveBeenLastCalledWith(
        'fakehttps://insecure.com/'
      );
      expect(loadRequest).toHaveBeenLastCalledWith(
        false,
        'fakehttps://insecure.com/',
        4
      );
    });

    test('loadRequest allows for valid URIs', async () => {
      const onShouldStartLoadWithRequest = createOnShouldStartLoadWithRequest(
        loadRequest,
        [
          'plus+https://*',
          'DOT.https://*',
          'dash-https://*',
          '0invalid://*',
          '+invalid://*',
        ]
      );

      onShouldStartLoadWithRequest({
        nativeEvent: {
          url: 'plus+https://www.example.com/',
          lockIdentifier: 1,
        },
      });

      await flushPromises();
      expect(Linking.openURL).toHaveBeenCalledTimes(0);
      expect(loadRequest).toHaveBeenLastCalledWith(
        true,
        'plus+https://www.example.com/',
        1
      );

      onShouldStartLoadWithRequest({
        nativeEvent: { url: 'DOT.https://www.example.com/', lockIdentifier: 2 },
      });

      await flushPromises();

      expect(Linking.openURL).toHaveBeenCalledTimes(0);
      expect(loadRequest).toHaveBeenLastCalledWith(
        true,
        'DOT.https://www.example.com/',
        2
      );

      onShouldStartLoadWithRequest({
        nativeEvent: {
          url: 'dash-https://www.example.com/',
          lockIdentifier: 3,
        },
      });

      await flushPromises();

      expect(Linking.openURL).toHaveBeenCalledTimes(0);
      expect(loadRequest).toHaveBeenLastCalledWith(
        true,
        'dash-https://www.example.com/',
        3
      );

      onShouldStartLoadWithRequest({
        nativeEvent: { url: '0invalid://www.example.com/', lockIdentifier: 4 },
      });

      await flushPromises();

      expect(Linking.openURL).toHaveBeenLastCalledWith(
        '0invalid://www.example.com/'
      );
      expect(loadRequest).toHaveBeenLastCalledWith(
        false,
        '0invalid://www.example.com/',
        4
      );

      onShouldStartLoadWithRequest({
        nativeEvent: { url: '+invalid://www.example.com/', lockIdentifier: 5 },
      });

      await flushPromises();

      expect(Linking.openURL).toHaveBeenLastCalledWith(
        '+invalid://www.example.com/'
      );
      expect(loadRequest).toHaveBeenLastCalledWith(
        false,
        '+invalid://www.example.com/',
        5
      );

      onShouldStartLoadWithRequest({
        nativeEvent: {
          url: 'FAKE+plus+https://www.example.com/',
          lockIdentifier: 6,
        },
      });

      await flushPromises();

      expect(Linking.openURL).toHaveBeenLastCalledWith(
        'FAKE+plus+https://www.example.com/'
      );
      expect(loadRequest).toHaveBeenLastCalledWith(
        false,
        'FAKE+plus+https://www.example.com/',
        6
      );
    });
  });
});
