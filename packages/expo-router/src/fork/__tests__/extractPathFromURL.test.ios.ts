import { extractExpoPathFromURL } from '../extractPathFromURL';

describe(extractExpoPathFromURL, () => {
  beforeEach(() => {
    if (typeof expo === 'undefined') {
      // @ts-expect-error
      globalThis.expo = {
        modules: {},
      };
    }
    delete expo.modules.ExpoGo;
  });
  afterAll(() => {
    delete globalThis.expo.modules.ExpoGo;
  });

  for (const [name, exenv] of [
    ['Expo Go', {}],
    ['Bare', undefined],
  ] as const) {
    describe(name, () => {
      test.each<string>([
        'scheme://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081%2Fexample%2Fpath',
        'scheme://expo-development-client/?url=http://acme.com/foo/bar?query=param',
        'scheme://expo-development-client/?url=acme://foo/bar?query=param&query2=param2',
        'app.bacon.expo://expo-development-client',
        'exp://127.0.0.1:19000/',
        'exp://127.0.0.1:19000/--/test/path?query=param',
        'exp://127.0.0.1:19000/--/test/path?shouldBeEscaped=x%252By%2540xxx.com',
        'exp://127.0.0.1:19000/x?y=x%252By%2540xxx.com',
        'exp://127.0.0.1:19000?query=param',
        'exp://u.expo.dev/update/123abc',
        'exp://u.expo.dev/update/123abc/--/test/path?query=param',
        'exp://u.expo.dev/update/123abc/efg',
        'exp://exp.host/@test/test',
        'exp://exp.host/@test/test/--/test/path?query=param',
        'exp://exp.host/@test/test/--/test/path',
        'exp://exp.host/@test/test/--/test/path/--/foobar',
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
        expo.modules.ExpoGo = exenv;

        const res = extractExpoPathFromURL(url);
        expect(res).toMatchSnapshot();

        if (exenv) {
          // Ensure the Expo Go handling never breaks
          expect(res).not.toMatch(/^--\//);
        }
      });
    });
  }
  it(`decodes query params in bare`, () => {
    delete expo.modules.ExpoGo;
    expect(extractExpoPathFromURL(`custom:///?x=%20%2B%2F`)).toEqual('?x= +/');
  });
  it(`decodes query params in Expo Go`, () => {
    expo.modules.ExpoGo = {};
    expect(extractExpoPathFromURL(`custom:///?x=%20%2B%2F`)).toEqual('?x= +/');
    expect(extractExpoPathFromURL(`exp://127.0.0.1:19000/--/test/path?x=%20%2B%2F`)).toEqual(
      'test/path?x= +/'
    );
    expect(extractExpoPathFromURL(`exp://x?y=%20%2B%2F`)).toEqual('?y= +/');
  });

  it(`only handles Expo Go URLs in Expo Go`, () => {
    delete expo.modules.ExpoGo;

    const res = extractExpoPathFromURL('exp://127.0.0.1:19000/--/test');
    // This should look mostly broken, but it's the best we can do
    // when someone uses this format outside of Expo Go.
    expect(res).toEqual('127.0.0.1:19000/--/test');
  });
});
