import { shouldLinkExternally, isWellKnownUri, hasUrlProtocolPrefix } from '../url';

describe(shouldLinkExternally, () => {
  ['./', '/', '/foo', 'bar'].forEach((href) => {
    it(`should return false for "${href}"`, () => {
      expect(shouldLinkExternally(href)).toBe(false);
    });
  });
  [
    'http://',
    'https://',
    'mailto://',
    'tel://',
    'sms://',
    'exp+com.my-app_thing://',
    'hello://world.com',
  ].forEach((href) => {
    it(`should return true for "${href}"`, () => {
      expect(shouldLinkExternally(href)).toBe(true);
    });
  });
});

describe(hasUrlProtocolPrefix, () => {
  [
    '',
    'hello',
    'about?uri=https://localhost:8081',
    'https%3A%2F%2Flocalhost%3A8081%3Fabout%3Dface',
  ].forEach((href) => {
    it(`should return false for "${href}"`, () => {
      expect(hasUrlProtocolPrefix(href)).toBe(false);
    });
  });
  [
    'http://',
    'https://',
    'mailto://',
    'tel://',
    'sms://',
    'exp+com.my-app_thing://',
    'hello://world.com',
  ].forEach((href) => {
    it(`should return true for "${href}"`, () => {
      expect(hasUrlProtocolPrefix(href)).toBe(true);
    });
  });
});

describe(isWellKnownUri, () => {
  [
    '',
    './something.mailto',
    './foo?mailto:expo',
    '  mailto:expo',
    'bacon://hello',
    'exp+com.my-app_thing://',
  ].forEach((href) => {
    it(`should return false for "${href}"`, () => {
      expect(isWellKnownUri(href)).toBe(false);
    });
  });
  [
    'mailto:',
    'mailto:bacon@expo.dev',
    'itmss://',
    'itms:hey',
    'http:foo',
    'tel:123456789',
    'sms:123456789',
    'geo:0,0',
    'maps:0,0',
    'market:0,0',
    'content:0,0',
    'file:0,0',
  ].forEach((href) => {
    it(`should return true for "${href}"`, () => {
      expect(isWellKnownUri(href)).toBe(true);
    });
  });
});
