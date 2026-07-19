'use strict';

import { UnavailabilityError } from 'expo-modules-core';

import ExponentTest from './ExponentTest';

export async function acceptPermissionsAndRunCommandAsync(fn) {
  if (!ExponentTest) {
    return await fn();
  }

  const results = await Promise.all([
    ExponentTest.action({
      selectorType: 'text',
      selectorValue: 'Allow',
      actionType: 'click',
      delay: 1000,
      timeout: 100,
    }),
    fn(),
  ]);

  return results[1];
}

export async function shouldSkipTestsRequiringPermissionsAsync() {
  if (!ExponentTest || !ExponentTest.shouldSkipTestsRequiringPermissionsAsync) {
    return false;
  }
  return ExponentTest.shouldSkipTestsRequiringPermissionsAsync();
}

export async function expectMethodToBeUnavailableAsync(expect, method) {
  const error = await expectMethodToThrowAsync(method);
  expect(error instanceof UnavailabilityError).toBeTruthy();
}

export async function expectMethodToThrowAsync(method) {
  try {
    await method();
  } catch (error) {
    return error;
  }
}
