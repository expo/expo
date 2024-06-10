import { buildUrlForBundle } from '../buildUrlForBundle';

it(`returns an expected URL`, () => {
  expect(buildUrlForBundle('foobar')).toEqual('/foobar');
});
it(`returns an expected URL with non standard root`, () => {
  expect(buildUrlForBundle('/more/than/one')).toEqual('/more/than/one');
});
describe(`encodes special characters relevant for S3`, () => {
  it('encodes a "+" symbol', () => {
    expect(buildUrlForBundle('/+not-found')).toEqual('/%2bnot-found');
  });
  it('ignores query parameters', () => {
    expect(buildUrlForBundle('/+test?param=+true')).toEqual('/%2btest?param=+true');
  });
  it('encodes pathnames of URIs', () => {
    expect(buildUrlForBundle('http://test.com/+not-found')).toEqual('http://test.com/%2bnot-found');
  });
  it('encodes various characters of pathnames', () => {
    expect(buildUrlForBundle('/+!"#$&\'()*+,:;=@')).toMatchSnapshot();
  });
  it('encodes other special characters of pathnames', () => {
    expect(buildUrlForBundle('/é')).toBe('/%C3%A9');
  });
});
