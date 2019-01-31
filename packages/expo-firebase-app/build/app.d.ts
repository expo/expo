import { FirebaseOptions } from './types';
export default class App {
    _extendedProps: {
        [key: string]: boolean;
    };
    _initialized: boolean;
    _name: string;
    _nativeInitialized: boolean;
    _options: FirebaseOptions;
    constructor(name: string, options: FirebaseOptions, fromNative?: boolean);
    /**
     *
     * @return {*}
     */
    readonly name: string;
    /**
     *
     * @return {*}
     */
    readonly options: FirebaseOptions;
    /**
     * Undocumented firebase web sdk method that allows adding additional properties onto
     * a firebase app instance.
     *
     * See: https://github.com/firebase/firebase-js-sdk/blob/master/tests/app/firebase_app.test.ts#L328
     *
     * @param props
     */
    extendApp(props: Object): void;
    delete(): Promise<any>;
    onReady(): Promise<App>;
    /**
     * toString returns the name of the app.
     *
     * @return {string}
     */
    toString(): string;
}
