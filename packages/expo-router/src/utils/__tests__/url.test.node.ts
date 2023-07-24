import { hasUrlProtocolPrefix } from '../url';

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
