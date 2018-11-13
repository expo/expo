export default {
  get name() {
    return 'ExpoGoogleSignIn';
  },
  get ERRORS() {
    return {};
  },
  get SCOPES() {
    return {};
  },
  get TYPES() {
    return {
      DEFAULT: 'default',
      GAMES: 'games',
    };
  },
  isSignedInAsync() {
    return Promise.resolve();
  },
  initAsync() {
    return Promise.resolve();
  },
  signInSilentlyAsync() {
    return Promise.resolve();
  },
  signInAsync() {
    return Promise.resolve();
  },
  signOutAsync() {
    return Promise.resolve();
  },
  disconnectAsync() {
    return Promise.resolve();
  },
  getTokensAsync() {
    return Promise.resolve({
      idToken: null,
      accessToken: null,
    });
  },
  getCurrentUserAsync() {
    return null;
  },
  getPhotoAsync() {
    return null;
  },
};
