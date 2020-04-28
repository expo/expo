import React from 'react';
import { NativeModules, StyleSheet, Text, View } from 'react-native';
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
 * In production the app will just hard crash on errors, unless the developer decides to handle
 * them by overriding the global error handler and swallowing the error, in which case they are
 * responsible for determining how to recover from this state.
 *
 * - The sole purpose of this component is to hide the splash screen if an error
 * occurs that prevents it from being hidden. Please note that this currently only works
 * with <AppLoading /> and not SplashScreen.preventAutoHide()!
 * - On iOS the splash screen hides itself, but we provide a uniform error screen with Android.
 * - On Android it is necessary for us to render some content in order to hide the splash screen,
 * just calling `ExponentAppLoadingManager.finishedAsync()` is not sufficient.
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
    componentDidCatch(_error, _errorInfo) {
        if (_appLoadingIsMounted) {
            finishedAsync();
        }
    }
    render() {
        if (this.state.error) {
            return (<View style={styles.container}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={[styles.paragraph, { color: '#000' }]}>
            You are seeing this screen because a fatal error was encountered before the splash
            screen was hidden.
          </Text>
          <Text style={styles.paragraph}>
            Review your application logs for more information, then come back and reload this app
            when you are ready. In production, your app would have crashed and closed.
          </Text>
        </View>);
        }
        else {
            return this.props.children;
        }
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    paragraph: {
        marginBottom: 10,
        textAlign: 'center',
        marginHorizontal: 30,
        maxWidth: 350,
        fontSize: 15,
        color: '#888',
    },
    warningIcon: {
        fontSize: 40,
        marginBottom: 20,
    },
});
//# sourceMappingURL=RootErrorBoundary.js.map