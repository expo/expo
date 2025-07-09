import Constants, { ExecutionEnvironment } from 'expo-constants';
import { mockProperty, unmockAllProperties } from 'jest-expo';

import * as Linking from '../Linking';
import { QueryParams } from '../Linking.types';

describe('parse', () => {
  beforeAll(() => {
    mockProperty(Constants.manifest as any, 'hostUri', 'exp.host/@test/test');
  });
  afterAll(() => {
    unmockAllProperties();
  });

  test.each<string>([
    'exp://127.0.0.1:8081/',
    'exp://127.0.0.1:8081/--/test/path?query=param',
    'exp://127.0.0.1:8081?query=param',
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
  ])(`parses %p`, (url) => {
    expect(Linking.parse(url)).toMatchSnapshot();
  });
});

describe(Linking.createURL, () => {
  const consoleWarn = console.warn;
  const executionEnvironment = Constants.executionEnvironment;

  describe('queries', () => {
    describe.each<string>(['exp.host/@test/test', 'u.expo.dev/update/some-guid'])(
      `for hostUri %p`,
      (hostUri) => {
        beforeEach(() => {
          console.warn = jest.fn();
          Constants.executionEnvironment = ExecutionEnvironment.StoreClient;
          mockProperty(Constants.manifest as any, 'hostUri', hostUri);
          mockProperty(Constants.manifest as any, 'scheme', 'demo');
        });

        afterEach(() => {
          console.warn = consoleWarn;
          Constants.executionEnvironment = executionEnvironment;
          unmockAllProperties();
        });

        test.each<QueryParams>([
          { shouldEscape: '%2b%20' },
          { escapePluses: 'email+with+plus@whatever.com' },
          { emptyParam: '' },
          { undefinedParam: undefined },
          { lotsOfSlashes: '/////' },
        ])(`makes url %p`, (queryParams) => {
          expect(Linking.createURL('some/path', { queryParams })).toMatchSnapshot();
        });

        test.each<string>(['path/into/app', ''])(`makes url %p`, (path) => {
          expect(Linking.createURL(path)).toMatchSnapshot();
        });
      }
    );
  });

  describe('bare', () => {
    beforeEach(() => {
      console.warn = jest.fn();
      Constants.executionEnvironment = ExecutionEnvironment.Bare;
      mockProperty(Constants.manifest as any, 'hostUri', null);
      mockProperty(Constants.manifest as any, 'scheme', 'demo');
    });

    afterEach(() => {
      console.warn = consoleWarn;
      Constants.executionEnvironment = executionEnvironment;
      unmockAllProperties();
    });

    test.each<QueryParams>([
      { shouldEscape: '%2b%20' },
      { escapePluses: 'email+with+plus@whatever.com' },
      { emptyParam: '' },
      { undefinedParam: undefined },
      { lotsOfSlashes: '/////' },
    ])(`makes url %p`, (queryParams) => {
      expect(Linking.createURL('some/path', { queryParams })).toMatchSnapshot();
    });

    test.each<string>(['path/into/app', ''])(`makes url %p`, (path) => {
      expect(Linking.createURL(path)).toMatchSnapshot();
    });

    it(`uses triple slashes`, () => {
      expect(Linking.createURL('some/path', { isTripleSlashed: true })).toMatchSnapshot();
    });
  });
});
