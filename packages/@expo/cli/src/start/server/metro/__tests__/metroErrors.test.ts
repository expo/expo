import FailedToResolveNameError from '@expo/metro/metro-resolver/errors/FailedToResolveNameError';
import FailedToResolvePathError from '@expo/metro/metro-resolver/errors/FailedToResolvePathError';

import { isFailedToResolveNameError, isFailedToResolvePathError } from '../metroErrors';

it(`matches upstream metro-resolver errors`, () => {
  expect(isFailedToResolveNameError(new FailedToResolveNameError(['/'], ['/']))).toBe(true);
  expect(
    isFailedToResolvePathError(
      new FailedToResolvePathError({
        dir: { type: 'asset', name: 'foobar' },
        file: { type: 'asset', name: 'foobar' },
      })
    )
  ).toBe(true);
});

it(`doesn't match other errors`, () => {
  expect(isFailedToResolveNameError(new Error())).toBe(false);
  expect(isFailedToResolvePathError(new Error())).toBe(false);
});
