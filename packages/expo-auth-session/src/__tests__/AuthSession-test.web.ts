import { Platform } from 'expo-modules-core';

import { makeRedirectUri } from '../AuthSession';

describe('Web and SSR', () => {
  it(`Creates a redirect URL`, () => {
    expect(makeRedirectUri()).toBe(Platform.isDOMAvailable ? 'http://localhost' : '');
  });

  it(`Creates a redirect URL with a custom path`, () => {
    expect(makeRedirectUri({ path: 'bacon' })).toBe(
      Platform.isDOMAvailable ? 'http://localhost/bacon' : ''
    );
  });
});
