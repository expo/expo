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
    expect(parsePlatformHeader(asRequest({ url: 'http://localhost:19000/?platform=ios' }))).toBe(
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
          url: 'http://localhost:19000/?platform=ios',
          headers: { 'expo-platform': 'android' },
        })
      )
    ).toBe('ios');
  });
  it(`prefers expo to exponent header`, () => {
    expect(
      parsePlatformHeader(
        asRequest({
          url: 'http://localhost:19000/',
          headers: {
            'expo-platform': 'android',
            'exponent-platform': 'ios',
          },
        })
      )
    ).toBe('android');
  });
});

describe(resolvePlatformFromUserAgentHeader, () => {
  it(`resolves ios from user-agent string`, () => {
    expect(
      resolvePlatformFromUserAgentHeader(
        asRequest({
          url: 'http://localhost:3000',
          headers: {
            'user-agent':
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
              'Mozilla/5.0 (Linux; Android 11; Pixel 2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Mobile Safari/537.36',
          },
        })
      )
    );
  });
  it(`returns null`, () => {
    expect(
      resolvePlatformFromUserAgentHeader(
        asRequest({
          url: 'http://localhost:3000',
          headers: {},
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
    }).toThrowError('platform must be "android" or "ios". Received: "not-supported"');
  });
});
