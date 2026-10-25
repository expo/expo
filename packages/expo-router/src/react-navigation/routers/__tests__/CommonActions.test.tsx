import { expect, test } from '@jest/globals';

import * as CommonActions from '../CommonActions';

test('does not export deprecated navigation actions', () => {
  expect(CommonActions).not.toHaveProperty('navigateDeprecated');
});

test('throws if NAVIGATE is called without name', () => {
  // @ts-expect-error: we're explicitly using an invalid argument here
  expect(() => CommonActions.navigate({})).toThrow(
    "Pass a route name, for example navigate({ name: 'home' })."
  );
});
