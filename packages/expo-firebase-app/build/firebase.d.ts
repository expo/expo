import App from './app';
import { FirebaseOptions } from './types';
declare class Firebase {
    constructor();
    /**
     * Web SDK initializeApp
     *
     * @param options
     * @param name
     * @return {*}
     */
    initializeApp(options: FirebaseOptions, name: string): App;
    /**
     * Retrieves a Firebase app instance.
     *
     * When called with no arguments, the default app is returned.
     * When an app name is provided, the app corresponding to that name is returned.
     *
     * @param name
     * @return {*}
     */
    app(name?: string): App;
    /**
     * A (read-only) array of all initialized apps.
     * @return {Array}
     */
    readonly apps: App[];
    /**
     * The current SDK version.
     * @return {string}
     */
    readonly SDK_VERSION: string;
}
declare const _default: Firebase;
export default _default;
