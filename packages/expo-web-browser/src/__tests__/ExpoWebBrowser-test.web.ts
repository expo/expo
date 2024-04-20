import { normalizeUrl, featureObjectToString } from '../ExpoWebBrowser.web';

describe(normalizeUrl, () => {
  it(`normalizes url`, async () => {
    expect(normalizeUrl(new URL('https://expo.io'))).toBe('expo.io/');
    expect(normalizeUrl(new URL('HTTP://localhost:8081/FOO/bar?a=b&b=a#123'))).toBe(
      'localhost:8081/foo/bar'
    );
    expect(normalizeUrl(new URL('exp://foobar:'))).toBe('null');
    expect(normalizeUrl(new URL('https://localhost:777//fooo//bser/'))).toBe(
      'localhost:777/fooo/bser/'
    );
  });
});

describe('featureObjectToString', () => {
  it(`converts object to string`, async () => {
    expect(
      featureObjectToString({
        foo: 'bar',
        // Test that empty strings are omitted
        invalid: '',
        // Test that booleans are converted to yes/no strings
        enabled: true,
        disabled: false,
        // Test that string booleans are left alone
        gotMilk: 'yes',
      })
    ).toBe('foo=bar,enabled=yes,disabled=no,gotMilk=yes');
  });
});
