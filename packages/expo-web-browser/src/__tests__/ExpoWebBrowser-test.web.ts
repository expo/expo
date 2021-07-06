import { featureObjectToString } from '../ExpoWebBrowser.web';

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
