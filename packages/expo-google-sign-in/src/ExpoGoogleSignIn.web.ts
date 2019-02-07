export default {
  get name(): string {
    return 'ExpoGoogleSignIn';
  },
  get ERRORS(): { [key: string]: string } {
    return {};
  },
  get SCOPES(): { [key: string]: string } {
    return {};
  },
  get TYPES(): { [key: string]: string } {
    return {};
  },
  async isConnectedAsync(): Promise<boolean> {
    return false;
  },
};
