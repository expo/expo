import * as GoogleSignIn from '../GoogleSignIn';

/* More tests are in test-suite */

it(`has constants`, () => {
  function validateConstants(constants) {
    expect(constants).toBeDefined();
    for (const constant of Object.values(constants)) {
      expect(typeof constant).toBe('string');
    }
  }

  validateConstants(GoogleSignIn.ERRORS);
  validateConstants(GoogleSignIn.SCOPES);
  validateConstants(GoogleSignIn.TYPES);
});

it(`can invoke any function`, async () => {
  GoogleSignIn.allowInClient();
  GoogleSignIn.getCurrentUser();
  await GoogleSignIn.signInSilentlyAsync();
  await Promise.all([
    GoogleSignIn.askForPlayServicesAsync(),
    GoogleSignIn.getPlayServiceAvailability(),
    GoogleSignIn.initAsync(),
    GoogleSignIn.isSignedInAsync(),
    GoogleSignIn.isConnectedAsync(),
    GoogleSignIn.signInAsync(),
    GoogleSignIn.signOutAsync(),
    GoogleSignIn.disconnectAsync(),
    GoogleSignIn.getCurrentUserAsync(),
    GoogleSignIn.getPhotoAsync(),
  ]);
});
