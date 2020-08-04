import React from 'react';
declare type Props = {
    children: React.ReactNode;
};
declare type State = {
    error: Error | null;
};
/**
 * This component is never rendered in production!
 *
 * In production the app will just hard crash on errors, unless the developer
 * decides to handle them by overriding the global error handler and swallowing
 * the error, in which case they are responsible for determining how to recover
 * from this state.
 *
 * - The sole purpose of this component is to hide the splash screen if an
 * error occurs that prevents it from being hidden. Please note that this
 * currently only works with <AppLoading /> and not SplashScreen.preventAutoHide()!
 * - We only want to update the error state when the splash screen is visible, after
 * the splash screen is gone we don't want to do anything in this component.
 * - On Android it is necessary for us to render some content in order to hide
 * the splash screen, just calling `ExponentAppLoadingManager.finishedAsync()`
 * is not sufficient.
 *
 */
export default class RootErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props);
    /**
     * Test this by adding `throw new Error('example')` to your root component
     * when the AppLoading component is rendered.
     */
    static getDerivedStateFromError(_error: Error): {
        error: boolean;
    } | null;
    componentDidCatch(error: Error, _errorInfo: any): void;
    _subscribeToGlobalErrors: () => void;
    _unsubscribeFromGlobalErrors: () => void;
    render(): {} | null | undefined;
}
export {};
