import React from 'react';
import { NativeModules } from 'react-native';
import { getAppLoadingLifecycleEmitter } from './AppLoading';
const { ExponentAppLoadingManager } = NativeModules;
async function finishedAsync() {
    if (ExponentAppLoadingManager && ExponentAppLoadingManager.finishedAsync) {
        return await ExponentAppLoadingManager.finishedAsync();
    }
}
// Store this outside of the component so it is available inside getDerivedStateFromError
let _appLoadingIsMounted;
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
export default class RootErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this._subscribeToGlobalErrors = () => {
            _appLoadingIsMounted = true;
            const originalErrorHandler = ErrorUtils.getGlobalHandler();
            ErrorUtils.setGlobalHandler((error, isFatal) => {
                if (_appLoadingIsMounted) {
                    finishedAsync();
                    if (isFatal) {
                        this.setState({ error });
                    }
                }
                originalErrorHandler(error, isFatal);
            });
        };
        this._unsubscribeFromGlobalErrors = () => {
            // We don't remove the global error handler that we set here because it is conceivable that the
            // user may add error handlers *after* we subscribe, and we don't want to override those, so
            // instead we just gate the call
            _appLoadingIsMounted = false;
        };
        _appLoadingIsMounted = false;
        getAppLoadingLifecycleEmitter().once('componentDidMount', this._subscribeToGlobalErrors);
        getAppLoadingLifecycleEmitter().once('componentWillUnmount', this._unsubscribeFromGlobalErrors);
        this.state = {
            error: null,
        };
    }
    /**
     * Test this by adding `throw new Error('example')` to your root component
     * when the AppLoading component is rendered.
     */
    static getDerivedStateFromError(_error) {
        if (_appLoadingIsMounted) {
            return { error: true };
        }
        return null;
    }
    componentDidCatch(error, _errorInfo) {
        if (_appLoadingIsMounted) {
            finishedAsync();
        }
        throw error;
    }
    render() {
        if (this.state.error) {
            return null;
        }
        else {
            return this.props.children;
        }
    }
}
//# sourceMappingURL=RootErrorBoundary.js.map