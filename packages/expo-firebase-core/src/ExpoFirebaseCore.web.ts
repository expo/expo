import { IFirebaseOptions } from './FirebaseOptions';

export default {
  get DEFAULT_APP_NAME(): string {
    return '[DEFAULT]';
  },

  get DEFAULT_APP_OPTIONS(): IFirebaseOptions | void {
    // Not supported yet. This may be supported when for instance
    // a `googleServicesFile` config can be provided for the web
    // platform in app.json.
    return undefined;
  },
};
