// @flow

export default {
  get name(): string {
    return 'ExpoGoogleSignIn';
  },
  get ERRORS(): { [string]: string } {
    return {};
  },
  get SCOPES(): { [string]: string } {
    return {};
  },
  get TYPES(): { [string]: string } {
    return {
      DEFAULT: 'default',
      GAMES: 'games',
    };
  },
  async isSignedInAsync(): Promise {},
  async initAsync(): Promise {},
  async signInSilentlyAsync(): Promise {},
  async signInAsync(): Promise {},
  async signOutAsync(): Promise {},
  async disconnectAsync(): Promise {},
  async getTokensAsync() {
    return {
      idToken: null,
      accessToken: null,
    };
  },
  async getCurrentUserAsync() {
    return null;
  },
  async getPhotoAsync() {
    return null;
  },
};
