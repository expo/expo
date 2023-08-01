import { buildUrlForBundle } from '../buildUrlForBundle';

it(`returns an expected URL`, () => {
  expect(buildUrlForBundle('foobar')).toEqual('/foobar');
});
it(`returns an expected URL with non standard root`, () => {
  expect(buildUrlForBundle('/more/than/one')).toEqual('/more/than/one');
});
