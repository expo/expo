import { FirebaseOptions } from './FirebaseOptions';
export { FirebaseOptions } from './FirebaseOptions';
/**
 * Name of the default Firebase app (e.g. `[DEFAULT]`).
 *
 * In Expo Go, a Firebase App is created for each project that is loaded, and a unique name for each
 * project is returned.
 */
export declare const DEFAULT_APP_NAME: string | void;
/**
 * Firebase options with which the default app was initialized. If no Google services configuration
 * was provided, `undefined` is returned.
 *
 * Depending on the platform, the options are read from the following files and `app.json` keys.
 *
 * | Platform | File                       | App.json key                 |
 * | -------- | -------------------------- | ---------------------------- |
 * | iOS      | `GoogleService-Info.plist` | `ios.googleServicesFile`     |
 * | Android  | `google-services.json`     | `android.googleServicesFile` |
 * | Web      | -                          | `web.config.firebase`        |
 *
 * # Example
 *
 * ```js
 * console.log(FirebaseCore.DEFAULT_APP_OPTIONS);
 * {
 *   appId: "1:1082251606918:ios:a2800bc715889446e24a07",
 *   apiKey: "AIzaXXXXXXXX-xxxxxxxxxxxxxxxxxxx",
 *   clientId: "000000000000-0000000000000.apps.googleusercontent.com",
 *   trackingId: 12345567890,
 *   databaseURL: "https://myexpoapp777.firebaseio.com",
 *   storageBucket:  "myexpoapp777.appspot.com",
 *   projectId: "myexpoapp777",
 *   messagingSenderId:  123454321
 * }
 * ```
 */
export declare const DEFAULT_APP_OPTIONS: FirebaseOptions | void;
/**
 * The default Firebase options as defined in `web.config.firebase` in `app.json`.
 */
export declare const DEFAULT_WEB_APP_OPTIONS: FirebaseOptions | void;
//# sourceMappingURL=FirebaseCore.d.ts.map