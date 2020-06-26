import Constants from 'expo-constants';
import { Platform } from 'react-native';

import * as Linking from '../Linking';
import { QueryParams } from '../Linking.types';

describe('parse', () => {
  test.each<string>([
    'exp://127.0.0.1:19000/',
    'exp://127.0.0.1:19000/--/test/path?query=param',
    'exp://127.0.0.1:19000?query=param',
    'exp://exp.host/@test/test/--/test/path?query=param',
    'exp://exp.host/@test/test/--/test/path',
    'https://example.com/test/path?query=param',
    'https://example.com/test/path',
    'https://example.com:8000/test/path',
    'https://example.com:8000/test/path+with+plus',
    'https://example.com/test/path?query=do+not+escape',
    'https://example.com/test/path?missingQueryValue=',
    'custom:///?shouldBeEscaped=x%252By%2540xxx.com',
    'custom:///test/path?foo=bar',
    'custom:///',
    'custom://',
    'custom://?hello=bar',
    'invalid',
  ])(`parses %p`, url => {
    expect(Linking.parse(url)).toMatchSnapshot();
  });
});

describe('makeUrl queries', () => {
  const consoleWarn = console.warn;
  beforeEach(() => {
    console.warn = jest.fn();
  });

  afterEach(() => {
    console.warn = consoleWarn;
  });

  test.each<QueryParams>([
    { shouldEscape: '%2b%20' },
    { escapePluses: 'email+with+plus@whatever.com' },
    { emptyParam: '' },
    { undefinedParam: undefined },
    { lotsOfSlashes: '/////' },
  ])(`makes url %p`, queryParams => {
    expect(Linking.makeUrl('some/path', queryParams)).toMatchSnapshot();
  });

  test.each<string>(['path/into/app', ''])(`makes url %p`, path => {
    expect(Linking.makeUrl(path)).toMatchSnapshot();
  });
});

if (Platform.OS !== 'web') {
  describe('makeUrl in bare workflow', () => {
    const consoleWarn = console.warn;
    const constantsManifest = Constants.manifest;

    beforeEach(() => {
      console.warn = jest.fn();
      // @ts-ignore:  Constants.manifest type is not currently nullable
      Constants.manifest = null;
    });

    afterEach(() => {
      console.warn = consoleWarn;
      Constants.manifest = constantsManifest;
    });

    it('should return empty string and warn', () => {
      expect(Linking.makeUrl('/')).toEqual('');
      expect(console.warn).toHaveBeenCalledWith(expect.stringMatching('not supported in bare'));
    });
  });
}
