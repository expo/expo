/**
 * @hidden
 */
export interface RequireContext {
    /** Return the keys that can be resolved. */
    keys(): string[];
    (id: string): any;
    <T>(id: string): T;
    /** **Unimplemented:** Return the module identifier for a user request. */
    resolve(id: string): string;
    /** **Unimplemented:** Readable identifier for the context module. */
    id: string;
}
/**
 * The list of input keys will become optional, everything else will remain the same.
 */
export type PickPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
/**
 * Created by using a special file called `+native-intent.tsx` at the top-level of your
 * project's **app** directory. It exports `redirectSystemPath` or `legacy_subscribe` functions,
 * both methods designed to handle URL/path processing.
 *
 * Useful for re-writing URLs to correctly target a route when unique/referred URLs
 * are incoming from third-party providers or stale URLs from previous versions.
 *
 * @see For more information on how to use `NativeIntent`, see [Customizing links](/router/advanced/native-intent/).
 */
export type NativeIntent = {
    /**
     * A special method used to process URLs in native apps. When invoked, it receives an
     * `options` object with the following properties:
     * - **path**: represents the URL or path undergoing processing.
     * - **initial**: a boolean indicating whether the path is the app's initial URL.
     *
     * It's return value should either be a `string` or a `Promise<string>`.
     * Note that throwing errors within this method may result in app crashes. It's recommended to
     * wrap your code inside a `try/catch` block and utilize `.catch()` when appropriate.
     *
     * @see For usage information, see [Redirecting system paths](/router/advanced/native-intent/#redirectsystempath).
     */
    redirectSystemPath?: (event: {
        path: string;
        initial: boolean;
    }) => Promise<string> | string;
    /**
     * > **warning** Experimentally available in SDK 52.
     *
     * Useful as an alternative API when a third-party provider doesn't support Expo Router
     * but has support for React Navigation via `Linking.subscribe()` for existing projects.
     *
     * Using this API is not recommended for newer projects or integrations since it is
     * incompatible with Server Side Routing and
     * [Static Rendering](/router/reference/static-rendering/), and can become challenging to manage while offline or in a low network environment.
     *
     */
    legacy_subscribe?: (listener: (url: string) => void) => undefined | void | (() => void);
};
export type * from './typed-routes/types';
//# sourceMappingURL=types.d.ts.map