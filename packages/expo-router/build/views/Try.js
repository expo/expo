'use client';
import React, { Component } from 'react';
import * as SplashScreen from './Splash';
import { MetroServerError } from '../rsc/router/errors';
// No way to access `getDerivedStateFromError` from a function component afaict.
export class Try extends Component {
    state = { error: undefined };
    static getDerivedStateFromError(error) {
        // Force hide the splash screen if an error occurs.
        SplashScreen.hideAsync();
        if (__DEV__ && error instanceof MetroServerError) {
            // Throw up to the LogBox.
            return null;
        }
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
        return <ErrorBoundary error={error} retry={this.retry}/>;
    }
}
//# sourceMappingURL=Try.js.map