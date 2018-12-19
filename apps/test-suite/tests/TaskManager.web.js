import { Platform } from 'expo-core';
import { UnavailabilityError } from 'expo-errors';
import { TaskManager } from 'expo';

export const name = 'TaskManager';

const unavailableMessage = `is unavailable on ${Platform.OS}`;

/* This module is used for Native Google Authentication, perhaps we suggest that expo-app-auth or a user's own implementation by used on the web.  */

export async function test({ describe, it, expect }) {
  async function executeFailingMethod(method) {
    try {
      await method();
      expect(true).toBe(false);
    } catch (error) {
      expect(error instanceof UnavailabilityError).toBeTruthy();
    }
  }

  [
    'isTaskRegisteredAsync',
    'getTaskOptionsAsync',
    'getRegisteredTasksAsync',
    'unregisterTaskAsync',
    'unregisterAllTasksAsync',
  ].map(unsupportedMethod => {
    describe(`${name}.${unsupportedMethod}()`, () => {
      it(unavailableMessage, () => executeFailingMethod(TaskManager[unsupportedMethod]));
    });
  });
}
