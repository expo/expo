'use strict';
import { GoogleSignIn } from 'expo-google-sign-in';

export const name = 'GoogleSignIn';

export async function test({ describe, it, jasmine, expect }) {
  describe('GoogleSignIn', () => {
    describe('has constants', () => {
      function validateConstants(constants) {
        expect(constants).toBeDefined();
        Object.values(constants).map(constant => {
          expect(typeof constant).toBe('string');
        });
      }

      validateConstants(GoogleSignIn.ERRORS);
      validateConstants(GoogleSignIn.SCOPES);
      validateConstants(GoogleSignIn.TYPES);
    });

    it(`GoogleSignIn.initAsync() initializes Google Sign-In`, async () => {
      await GoogleSignIn.initAsync({
        clientId: '603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9.apps.googleusercontent.com',
      });
    });

    const methods = [
      'askForPlayServicesAsync',
      'hasPlayServicesAsync',
      'isSignedInAsync',
      'signInSilentlyAsync',
      'signInAsync',
      'signOutAsync',
      'disconnectAsync',
      'getCurrentUserAsync',
      'getPhotoAsync',
    ];

    methods.map(method => {
      it(`GoogleSignIn.${method}() runs without throwing an error`, async () =>
        await GoogleSignIn[method]());
    });
  });
}
