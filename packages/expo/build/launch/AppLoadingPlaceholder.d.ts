/**
 * NOTE(brentvatne):
 * AppLoadingPlaceholder exists to smooth the upgrade experience to SDK 40. The
 * placeholder behaves mostly as expected with the existing API, however it
 * will no longer leverage any native APIs to keep the splash screen visible.
 * This makes it so a user who upgrades and runs their app can see their app
 * running and get the warning about the AppLoading module being removed
 * top, without an extraneous red screen that would appear from attempting to
 * render an undefined AppLoading component.
 *
 * Remove this in SDK 42.
 */
import React from 'react';
declare type Props = {
    /**
     * Optional, you can do this process manually if you prefer.
     * This is mainly for backwards compatibility and it is not recommended.
     *
     * When provided, requires providing `onError` prop as well.
     * @deprecated
     */
    startAsync: () => Promise<void>;
    /**
     * If `startAsync` throws an error, it is caught and passed into the provided function.
     * @deprecated
     */
    onError: (error: Error) => void;
    /**
     * Called when `startAsync` resolves or rejects.
     * This should be used to set state and unmount the `AppLoading` component.
     * @deprecated
     */
    onFinish: () => void;
    /**
     * Whether to hide the native splash screen as soon as you unmount the `AppLoading` component.
     * Auto-hiding is enabled by default.
     */
    autoHideSplash?: boolean;
} | {
    /**
     * Whether to hide the native splash screen as soon as you unmount the `AppLoading` component.
     * Auto-hiding is enabled by default.
     */
    autoHideSplash?: boolean;
};
export default class AppLoadingPlaceholder extends React.Component<Props> {
    _isMounted: boolean;
    componentDidMount(): void;
    componentWillUnmount(): void;
    private startLoadingAppResourcesAsync;
    render(): null;
}
export {};
