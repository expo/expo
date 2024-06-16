import { CreateURLOptions, ParsedURL } from './Linking.types';
/**
 * Helper method for constructing a deep link into your app, given an optional path and set of query
 * parameters. Creates a URI scheme with two slashes by default.
 *
 * The scheme must be defined in the Expo config (`app.config.js` or `app.json`) under `expo.scheme`
 * or `expo.{android,ios}.scheme`. Platform-specific schemes defined under `expo.{android,ios}.scheme`
 * take precedence over universal schemes defined under `expo.scheme`.
 *
 * # Examples
 * - Development and production builds: `<scheme>://path` - uses the optional `scheme` property if provided, and otherwise uses the first scheme defined by your Expo config
 * - Web (dev): `https://localhost:19006/path`
 * - Web (prod): `https://myapp.com/path`
 * - Expo Go (dev): `exp://128.0.0.1:8081/--/path`
 *
 * The behavior of this method in Expo Go for published updates is undefined and should not be relied upon.
 * The created URL in this case is neither stable nor predictable during the lifetime of the app.
 * If a stable URL is needed, for example in authorization callbacks, a build (or development build)
 * of your application should be used and the scheme provided.
 *
 * @param path Addition path components to append to the base URL.
 * @param namedParameters Additional options object.
 * @return A URL string which points to your app with the given deep link information.
 */
export declare function createURL(path: string, { scheme, queryParams, isTripleSlashed }?: CreateURLOptions): string;
/**
 * Helper method for parsing out deep link information from a URL.
 * @param url A URL that points to the currently running experience (e.g. an output of `Linking.createURL()`).
 * @return A `ParsedURL` object.
 */
export declare function parse(url: string): ParsedURL;
//# sourceMappingURL=createURL.d.ts.map