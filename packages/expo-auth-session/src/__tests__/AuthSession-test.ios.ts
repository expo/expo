import { ExecutionEnvironment } from 'expo-constants';
import { mockLinking, mockProperty, unmockAllProperties } from 'jest-expo';

import { describeManifestTypes, mockConstants } from './ManifestTestUtils';

function mockOpenAuthSessionAsync(webBrowserModule, openBrowserFn) {
  mockProperty(webBrowserModule, 'openAuthSessionAsync', jest.fn(openBrowserFn));
}

beforeEach(() => {
  unmockAllProperties();
  jest.resetModules();
  jest.resetAllMocks();
});

describeManifestTypes(
  {
    id: '@example/abc',
    originalFullName: '@example/abc',
  },
  {
    extra: {
      expoClient: {
        name: 'wat',
        slug: 'wat',
        originalFullName: '@example/abc',
      },
    },
  }
)((manifestObj) => {
  beforeEach(() => {
    mockConstants(
      {
        executionEnvironment: ExecutionEnvironment.Standalone,
      },
      manifestObj
    );
  });

  it(`returns correct redirect URL from getRedirectUrl`, () => {
    const { getRedirectUrl } = require('../AuthSession');
    expect(getRedirectUrl()).toEqual('https://auth.expo.io/@example/abc');
  });

  it(`opens WebBrowser startAsync to the start URL`, async () => {
    const authUrl = 'abcd.com';
    const returnUrl = 'efgh.com';

    const { startAsync } = require('../AuthSession');
    const WebBrowser = require('expo-web-browser');

    mockOpenAuthSessionAsync(WebBrowser, async () => ({ type: 'cancel' }));
    await startAsync({ authUrl, returnUrl });

    const sessionUrlProvider = require('../SessionUrlProvider').default;
    expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      sessionUrlProvider.getStartUrl(authUrl, returnUrl),
      returnUrl,
      { showInRecents: false }
    );
  });

  it(`only lets you call startAsync once at a time`, async () => {
    const authUrl = 'abcd.com';
    const returnUrl = 'efgh.com';
    const normalResponse = { type: 'cancel' };
    const lockedResponse = { type: 'locked' };

    mockProperty(console, 'warn', jest.fn());

    const { startAsync } = require('../AuthSession');
    const WebBrowser = require('expo-web-browser');

    mockOpenAuthSessionAsync(WebBrowser, () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(normalResponse), 0);
      });
    });
    const parallelStartAsyncCalls = Promise.all([
      startAsync({ authUrl, returnUrl }),
      startAsync({ authUrl, returnUrl }),
    ]);

    const [first, second] = await parallelStartAsyncCalls;
    expect(first).toEqual(normalResponse);
    expect(second).toEqual(lockedResponse);
    expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/Only one AuthSession/));
  });

  it(`returns success with params on redirect`, async () => {
    const emitLinkingEvent = mockLinking();
    const authUrl = 'http://example.io';
    const returnUrl = 'https://example-return.io/+';
    const returnUrlWithParams = `${returnUrl}?id=42#token=abc123`;

    const { startAsync } = require('../AuthSession');
    const authSessionPromise = startAsync({
      authUrl,
      returnUrl,
    });
    emitLinkingEvent('url', { url: returnUrlWithParams });
    const result = await authSessionPromise;

    expect(result.type).toEqual('success');
    expect((result as any).params).toEqual({ token: 'abc123', id: '42' });
  });

  it(`returns error when errorCode is present`, async () => {
    const emitLinkingEvent = mockLinking();

    const authUrl = 'http://example.io';
    const returnUrl = 'https://example-return.io/+';

    const { startAsync } = require('../AuthSession');
    const authSessionPromise = startAsync({
      authUrl,
      returnUrl,
    });

    const returnUrlWithParams = `${returnUrl}?errorCode=nope&id=42`;
    emitLinkingEvent('url', { url: returnUrlWithParams });

    const result = await authSessionPromise;
    expect(result.type).toEqual('error');
    expect((result as any).errorCode).toEqual('nope');
    expect((result as any).params).toEqual({ id: '42' });
  });

  it(`throws from AuthSession.startAsync if authUrl is falsy`, async () => {
    expect.assertions(1);
    try {
      const { startAsync } = require('../AuthSession');
      await startAsync({
        authUrl: null as any,
      });
    } catch (e) {
      expect(e).toMatchSnapshot();
    }
  });

  it(`lets us call AuthSession.startAsync after param validation throws`, async () => {
    const { startAsync } = require('../AuthSession');
    try {
      await startAsync({ authUrl: null as any });
    } catch {}

    const emitLinkingEvent = mockLinking();
    const authUrl = 'http://example.io';
    const returnUrl = 'https://example-return.io/+';
    const returnUrlWithParams = `${returnUrl}?id=42#token=abc123`;

    const authSessionPromise = startAsync({
      authUrl,
      returnUrl,
    });
    emitLinkingEvent('url', { url: returnUrlWithParams });

    const result = await authSessionPromise;

    expect(result.type).not.toEqual('locked');
  });
});

describeManifestTypes(
  {
    id: '@anonymous/abc',
    originalFullName: undefined,
  },
  {
    extra: {
      expoClient: {
        name: 'wat',
        slug: 'wat',
        originalFullName: '@anonymous/abc',
      },
    },
  }
)((manifestObj) => {
  it(`warns if user is @anonymous in getRedirectUrl`, () => {
    mockConstants(
      {
        executionEnvironment: ExecutionEnvironment.Standalone,
      },
      manifestObj
    );

    mockProperty(console, 'warn', jest.fn());
    const { getRedirectUrl } = require('../AuthSession');
    getRedirectUrl();
    expect((console.warn as jest.Mock).mock.calls).toMatchSnapshot();
  });
});
