import {
  parsePlatformHeader,
  resolvePlatformFromUserAgentHeader,
  assertMissingRuntimePlatform,
  assertRuntimePlatform,
} from '../resolvePlatform';
import { ServerRequest } from '../server.types';

const asRequest = (req: Partial<ServerRequest>) => req as ServerRequest;

// Tests all functions
describe(parsePlatformHeader, () => {
  it(`returns null`, () => {
    expect(
      parsePlatformHeader(
        asRequest({
          url: 'http://localhost:3000',
          headers: {},
        })
      )
    ).toBe(null);
  });
  it(`parses from 'platform' query parameter`, () => {
    expect(parsePlatformHeader(asRequest({ url: 'http://localhost:8081/?platform=ios' }))).toBe(
      'ios'
    );
    // Handles arrays
    expect(parsePlatformHeader(asRequest({ url: '?platform=ios&platform=android' }))).toBe('ios');
  });

  for (const header of ['expo-platform', 'exponent-platform']) {
    it(`parses from '${header}' header`, () => {
      expect(
        parsePlatformHeader(
          asRequest({
            url: 'http://localhost:3000',
            headers: { [header]: 'ios' },
          })
        )
      ).toBe('ios');
      // Handles arrays
      expect(
        parsePlatformHeader(
          asRequest({
            url: 'http://localhost:3000',
            headers: { [header]: ['android', 'ios'] },
          })
        )
      ).toBe('android');
    });
  }
  it(`prefers query parameter to header`, () => {
    expect(
      parsePlatformHeader(
        asRequest({
          url: 'http://localhost:8081/?platform=ios',
          headers: { 'expo-platform': 'android' },
        })
      )
    ).toBe('ios');
  });
  it(`prefers expo to exponent header`, () => {
    expect(
      parsePlatformHeader(
        asRequest({
          url: 'http://localhost:8081/',
          headers: {
            'expo-platform': 'android',
            'exponent-platform': 'ios',
          },
        })
      )
    ).toBe('android');
  });
});

/**
 * To update the user-agent values in these tests, turn on EXPO_DEBUG and make a
 * request to load an interstitial page without the `platform` query param or
 * 'expo-platform' header
 */
describe(resolvePlatformFromUserAgentHeader, () => {
  it(`resolves ios from user-agent string`, () => {
    expect(
      resolvePlatformFromUserAgentHeader(
        asRequest({
          url: 'http://localhost:3000',
          headers: {
            'user-agent':
              // user-agent value from iPhone 15.2 simulator
              'Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Mobile/15E148 Safari/604.1',
          },
        })
      )
    );
  });
  it(`resolves android from user-agent string`, () => {
    expect(
      resolvePlatformFromUserAgentHeader(
        asRequest({
          url: 'http://localhost:3000',
          headers: {
            'user-agent':
              // user-agent value from a Google Pixel 2
              'Mozilla/5.0 (Linux; Android 11; Pixel 2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Mobile Safari/537.36',
          },
        })
      )
    );
  });
  it(`returns null from a non-matching user-agent string`, () => {
    expect(
      resolvePlatformFromUserAgentHeader(
        asRequest({
          url: 'http://localhost:3000',
          headers: {
            'user-agent':
              // user-agent value from Firefox on macOS
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:104.0) Gecko/20100101 Firefox/104.0',
          },
        })
      )
    );
  });
});

describe(assertMissingRuntimePlatform, () => {
  it('asserts missing', () => {
    expect(() => {
      assertMissingRuntimePlatform();
    }).toThrowError('Must specify "expo-platform" header or "platform" query parameter');
  });
  it('does not assert on valid', () => {
    assertMissingRuntimePlatform('ios');
    assertMissingRuntimePlatform('android');
  });
});

describe(assertRuntimePlatform, () => {
  it('asserts the union type', () => {
    expect(() => {
      assertRuntimePlatform('ios');
    }).not.toThrow();
    expect(() => {
      assertRuntimePlatform('android');
    }).not.toThrow();
    expect(() => {
      assertRuntimePlatform('not-supported');
    }).toThrowError('platform must be "android", "ios", or "web". Received: "not-supported"');
  });
});
