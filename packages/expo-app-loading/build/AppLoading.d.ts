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
export default class AppLoading extends React.Component<Props> {
    _isMounted: boolean;
    componentDidMount(): void;
    componentWillUnmount(): void;
    private startLoadingAppResourcesAsync;
    render(): JSX.Element;
}
export {};
