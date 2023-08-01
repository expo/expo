import React from 'react';
import { SplashScreen } from './Splash';
// No way to access `getDerivedStateFromError` from a functional component afaict.
export class Try extends React.Component {
    state = { error: undefined };
    static getDerivedStateFromError(error) {
        // Force hide the splash screen if an error occurs.
        SplashScreen.hideAsync();
        return { error };
    }
    retry = () => {
        return new Promise((resolve) => {
            this.setState({ error: undefined }, () => {
                resolve();
            });
        });
    };
    render() {
        const { error } = this.state;
        const { catch: ErrorBoundary, children } = this.props;
        if (!error) {
            return children;
        }
        return React.createElement(ErrorBoundary, { error: error, retry: this.retry });
    }
}
//# sourceMappingURL=Try.js.map