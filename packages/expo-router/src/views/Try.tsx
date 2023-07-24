import React from "react";

import { SplashScreen } from "./Splash";

/** Props passed to a page's `ErrorBoundary` export. */
export type ErrorBoundaryProps = {
  /** Retry rendering the component by clearing the `error` state. */
  retry: () => Promise<void>;
  /** The error that was thrown. */
  error: Error;
};

// No way to access `getDerivedStateFromError` from a functional component afaict.
export class Try extends React.Component<
  {
    catch: React.ComponentType<ErrorBoundaryProps>;
    children: React.ReactNode;
  },
  { error?: Error }
> {
  state = { error: undefined };

  static getDerivedStateFromError(error: Error) {
    // Force hide the splash screen if an error occurs.
    SplashScreen.hideAsync();

    return { error };
  }

  retry = () => {
    return new Promise<void>((resolve) => {
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
    return <ErrorBoundary error={error} retry={this.retry} />;
  }
}
