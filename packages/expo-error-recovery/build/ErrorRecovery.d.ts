import './ErrorRecovery.fx';
export declare const recoveredProps: ErrorRecoveryProps | null;
export declare type ErrorRecoveryProps = Record<string, any>;
/**
 * Set arbitrary error recovery props. If your project crashes in production as a result of a fatal
 * JS error, Expo will reload your project. If you've set these props, they'll be passed to your
 * reloaded project's initial props under `exp.errorRecovery`. Access to `localStorage` is required
 * on web, or else this will simply be a no-op.
 *
 * [Read more about error handling with Expo](/guides/errors).
 * @param props An object which will be passed to your reloaded project's initial props if the
 * project was reloaded as a result of a fatal JS error.
 */
export declare function setRecoveryProps(props: ErrorRecoveryProps): void;
