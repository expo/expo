'use strict';

import * as ExpoModulesExceptionTest from 'expo-modules-exception-test';

export const name = 'ExpoModulesExceptions';

export async function test(t) {
  t.describe(name, () => {
    t.describe('code', () => {
      t.it('synchronous function', () => {
        try {
          ExpoModulesExceptionTest.codedException();
          t.expect(true).toBe(false);
        } catch (error) {
          t.expect(error.code).toBe('E_TEST_CODE');
        }
      });
      t.it('asynchronous function - reject', async () => {
        try {
          await ExpoModulesExceptionTest.codedExceptionRejectAsync();
          t.expect(true).toBe(false);
        } catch (error) {
          t.expect(error.code).toBe('E_TEST_CODE');
        }
      });
      t.it('asynchronous function - throw', async () => {
        try {
          await ExpoModulesExceptionTest.codedExceptionThrowAsync();
          t.expect(true).toBe(false);
        } catch (error) {
          t.expect(error.code).toBe('E_TEST_CODE');
        }
      });
      t.it('asynchronous/concurrent function', async () => {
        try {
          await ExpoModulesExceptionTest.codedExceptionConcurrentAsync();
          t.expect(true).toBe(false);
        } catch (error) {
          t.expect(error.code).toBe('E_TEST_CODE');
        }
      });
    });
  });
}
