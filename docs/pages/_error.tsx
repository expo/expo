import * as Sentry from '@sentry/browser';
import React from 'react';

import { getRedirectPath } from '~/common/error-utilities';

const REDIRECT_SUFFIX = '?redirected';

type State = {
  notFound: boolean;
  redirectPath?: string;
  redirectFailed: boolean;
};
export default class Error extends React.Component<object, State> {
  state: State = {
    notFound: false,
    redirectPath: undefined,
    redirectFailed: false,
  };

  componentDidMount() {
    this._maybeRedirect();
  }

  _maybeRedirect = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const { pathname } = window.location;

    if (window.location.search === REDIRECT_SUFFIX) {
      Sentry.captureMessage(`Redirect failed`);
      this.setState({ redirectFailed: true });
      return;
    }

    const redirectPath = getRedirectPath(pathname);

    if (redirectPath !== pathname) {
      this.setState({ redirectPath });
      return;
    }

    // We are confident now that we can render a not found error
    this.setState({ notFound: true });
    Sentry.captureMessage(`Page not found (404)`);
  };

  componentDidUpdate(prevProps: object, prevState: State) {
    if (prevState.redirectPath !== this.state.redirectPath && typeof window !== 'undefined') {
      // Let people actually read the carefully crafted message and absorb the
      // cool emoji selection, they can just click through if they want speed
      setTimeout(() => {
        window.location.href = `${this.state.redirectPath}?redirected`;
      }, 1200);
    }
  }

  render() {
    return (
      <div
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column',
        }}>
        {this._renderContents()}
      </div>
    );
  }

  _renderContents = () => {
    const styles = {
      description: {
        textAlign: 'center' as const,
        maxWidth: 450,
        marginHorizontal: 30,
        lineHeight: '1.7em',
      },
      link: {
        textAlign: 'center' as const,
        marginTop: 20,
      },
    };

    if (this.state.redirectPath) {
      return (
        <>
          <h1>🕵️‍♀️️</h1>
          <p style={styles.description}>
            Hold tight, we are redirecting you to where we think this URL was intended to take you!
          </p>
          <p style={styles.link}>
            <a id="redirect-link" href={this.state.redirectPath}>
              Click here to possibly go there more quickly!
            </a>
          </p>
        </>
      );
    } else if (this.state.redirectFailed) {
      return (
        <>
          <h1>🏳️</h1>
          <p style={styles.description} id="__redirect_failed">
            We took an educated guess and tried to direct you to the right page, but it seems that
            did not work out! Maybe it doesn't exist anymore! 😔
          </p>
          <p style={styles.link}>
            <a href="/">Go to the Expo documentation, you can try searching there</a>
          </p>
        </>
      );
    } else if (this.state.notFound) {
      return (
        <>
          <h1>🤯</h1>
          <p style={styles.description} id="__not_found">
            <strong style={{ fontWeight: 'bold' }}>Uh oh, we couldn't find this page!</strong> We've
            made note of this and will investigate, but it's possible that the page you're looking
            for no longer exists!
          </p>
          <p style={styles.link}>
            <a href="/">Go to the Expo documentation, you can try searching there</a>
          </p>
        </>
      );
    } else {
      // Render nothing statically
    }
  };
}
