import FailedToResolveNameError from '@expo/metro/metro-resolver/errors/FailedToResolveNameError';
import FailedToResolvePathError from '@expo/metro/metro-resolver/errors/FailedToResolvePathError';
import FailedToResolveUnsupportedError from '@expo/metro/metro-resolver/errors/FailedToResolveUnsupportedError';

import {
  isFailedToResolveNameError,
  isFailedToResolvePathError,
  isFailedToResolveUnsupportedError,
} from '../metroErrors';

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
  expect(
    isFailedToResolveUnsupportedError(
      new FailedToResolveUnsupportedError("No resolver is registered for the 'node:' URI scheme.")
    )
  ).toBe(true);
});

it(`doesn't match other errors`, () => {
  expect(isFailedToResolveNameError(new Error())).toBe(false);
  expect(isFailedToResolvePathError(new Error())).toBe(false);
  expect(isFailedToResolveUnsupportedError(new Error())).toBe(false);
});
