import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';

import { makeRedirectUri } from '../AuthSession';

describe('Web and SSR', () => {
  it(`Creates a redirect URL`, () => {
    expect(makeRedirectUri()).toBe(canUseDOM ? 'http://localhost' : '');
  });

  it(`Creates a redirect URL with a custom path`, () => {
    expect(makeRedirectUri({ path: 'bacon' })).toBe(canUseDOM ? 'http://localhost/bacon' : '');
  });

  it(`Creates a redirect URL with useProxy`, () => {
    // The expected behavior is to be more forgiving and skip the useProxy error since it isn't available on web.
    expect(makeRedirectUri({ path: 'bacon', useProxy: true })).toBe(
      canUseDOM ? 'http://localhost/bacon' : ''
    );
  });
});
