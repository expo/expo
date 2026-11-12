import * as Linking from '../Linking';

describe(Linking.addEventListener, () => {
  it(`returns the expected subscription`, () => {
    const subscription = Linking.addEventListener('url', jest.fn());
    // NOTE(EvanBacon): This test ensures that the web and native implementations return the same subscription.
    subscription.remove();
  });
});

// `createURL` returns an empty string when `window` is not defined.
const describeBrowser = typeof window === 'undefined' ? describe.skip : describe;

describeBrowser(Linking.createURL, () => {
  it(`returns query params that parse back to the same values`, () => {
    const url = Linking.createURL('some/path', { queryParams: { q: 'a b&c' } });
    expect(Linking.parse(url).queryParams).toEqual({ q: 'a b&c' });
  });
});
