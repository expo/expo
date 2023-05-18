import { buildUrlForBundle } from '../buildUrlForBundle';

it(`returns an expected URL with no params`, () => {
  expect(buildUrlForBundle('/foobar', {})).toEqual('/foobar.bundle');
});
it(`returns an expected URL with params`, () => {
  expect(buildUrlForBundle('foobar', { platform: 'web' })).toEqual('/foobar.bundle?platform=web');
});
it(`returns an expected URL with non standard root`, () => {
  expect(buildUrlForBundle('/more/than/one', { happy: 'meal' })).toEqual(
    '/more/than/one.bundle?happy=meal'
  );
});
