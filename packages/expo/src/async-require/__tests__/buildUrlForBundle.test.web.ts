import { buildUrlForBundle } from '../buildUrlForBundle';

it(`returns an expected URL`, () => {
  expect(buildUrlForBundle('foobar')).toEqual(expect.stringMatching(/\/foobar$/));
});
it(`returns an expected URL with non standard root`, () => {
  expect(buildUrlForBundle('/more/than/one')).toEqual(expect.stringMatching(/\/more\/than\/one$/));
});
