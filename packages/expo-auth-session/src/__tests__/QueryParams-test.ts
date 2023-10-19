import * as QueryParams from '../QueryParams';

it(`parses a query string`, () => {
  const results = QueryParams.getQueryParams('https://demo.io?foo=bar&git=hub');
  expect(results.params).toStrictEqual({ foo: 'bar', git: 'hub' });
});

it(`parses an error from a query string`, () => {
  const results = QueryParams.getQueryParams(
    'https://demo.io?foo=bar&git=hub&errorCode=invalid_prompt'
  );
  expect(results.errorCode).toBe('invalid_prompt');
  expect(results.params.errorCode).not.toBeDefined();
  expect(results.params).toEqual({
    foo: 'bar',
    git: 'hub',
  });
});

it(`builds an encoded query string`, () => {
  const results = new URLSearchParams({ foo: 'bar', git: 'hub , ' }).toString();
  expect(results).toBe('foo=bar&git=hub+%2C+');
});
