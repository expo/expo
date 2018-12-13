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
    return {};
  },
  async isConnectedAsync(): Promise<boolean> {
    return false;
  },
};
