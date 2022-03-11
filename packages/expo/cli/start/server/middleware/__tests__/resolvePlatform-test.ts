import {
  parsePlatformHeader,
  assertMissingRuntimePlatform,
  assertRuntimePlatform,
} from '../resolvePlatform';
import { ServerRequest } from '../server.types';

const asRequest = (req: Partial<ServerRequest>) => req as ServerRequest;

// Tests all functions
describe(parsePlatformHeader, () => {
  it(`returns nullish`, () => {
    expect(parsePlatformHeader(asRequest({}))).toBe(null);
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
            headers: { [header]: 'ios' },
          })
        )
      ).toBe('ios');
      // Handles arrays
      expect(
        parsePlatformHeader(
          asRequest({
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
