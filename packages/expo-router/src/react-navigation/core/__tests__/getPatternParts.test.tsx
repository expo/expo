import { expect, test } from '@jest/globals';

import { getPatternParts } from '../getPatternParts';

test('splits a path into parts', () => {
  const path =
    '/users/:type//:page(profile|settings)/:id([a-z]+:(\\d+))?/:name?';

  expect(getPatternParts(path)).toEqual([
    { segment: 'users' },
    { segment: ':type', param: 'type' },
    {
      segment: ':page(profile|settings)',
      param: 'page',
      regex: 'profile|settings',
    },
    {
      segment: ':id([a-z]+:(\\d+))?',
      param: 'id',
      regex: '[a-z]+:(\\d+)',
      optional: true,
    },
    {
      segment: ':name?',
      param: 'name',
      optional: true,
    },
  ]);
});

test('thrown an error if duplicate params are found', () => {
  const path = '/users/:id/profile/:id';

  expect(() => getPatternParts(path)).toThrow(
    `Duplicate param name 'id' found in path: ${path}`
  );
});

test('throws an error if a colon is in the middle of a segment', () => {
  const path = '/users:profile';

  expect(() => getPatternParts(path)).toThrow(
    `Encountered ':' in the middle of a segment in path: ${path}`
  );
});

test('throws an error if a regex is not preceded by a colon', () => {
  const path = '/users/test(\\d+)';

  expect(() => getPatternParts(path)).toThrow(
    `Encountered '(' without preceding ':' in path: ${path}`
  );
});

test('throws an error if a regex starts at beginning', () => {
  const path = '/users/(\\d+)';

  expect(() => getPatternParts(path)).toThrow(
    `Encountered '(' without preceding ':' in path: ${path}`
  );
});

test('throws an error if a closing parenthesis is not preceded by an opening parenthesis', () => {
  const path = '/users/:id\\d+)';

  expect(() => getPatternParts(path)).toThrow(
    `Encountered ')' without preceding '(' in path: ${path}`
  );
});

test('throws an error if a question mark is not preceded by a colon', () => {
  const path = '/users/test?';

  expect(() => getPatternParts(path)).toThrow(
    `Encountered '?' without preceding ':' in path: ${path}`
  );
});

test('throws an error if a question mark starts at the beginning', () => {
  const path = '/users/?';

  expect(() => getPatternParts(path)).toThrow(
    `Encountered '?' without preceding ':' in path: ${path}`
  );
});

test('throws an error if a regex is not closed', () => {
  const path = '/users/:id(\\d+';

  expect(() => getPatternParts(path)).toThrow(
    `Could not find closing ')' in path: ${path}`
  );
});
