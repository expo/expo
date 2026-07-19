import { expect, test } from '@jest/globals';

import * as CommonActions from '../CommonActions';

test('throws if NAVIGATE is called without name', () => {
  // @ts-expect-error: we're explicitly using an invalid argument here
  expect(() => CommonActions.navigate({})).toThrow(
    'You need to specify a name when calling navigate with an object as the argument.'
  );
});
