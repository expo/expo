import { Platform } from 'expo-core';
import { UnavailabilityError } from 'expo-errors';
import { GoogleSignIn } from 'expo-google-sign-in';

export const name = 'GoogleSignIn';

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
    'initAsync',
    'signInAsync',
    'signOutAsync',
    'getCurrentUserAsync',
    'disconnectAsync',
    'getPhotoAsync',
    'isSignedInAsync',
  ].map(unsupportedMethod => {
    describe(`${name}.${unsupportedMethod}()`, () => {
      it(unavailableMessage, () => executeFailingMethod(GoogleSignIn[unsupportedMethod]));
    });
  });

  ['isConnectedAsync', 'signInSilentlyAsync'].map(unsupportedMethod => {
    describe(`${name}.${unsupportedMethod}()`, () => {
      it('method returns falsey', async () => {
        const value = await GoogleSignIn[unsupportedMethod]();
        expect(!!value).toBe(false);
      });
    });
  });
}
