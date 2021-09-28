import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import * as Sentry from '@sentry/browser';
import React from 'react';

import { getRedirectPath } from '~/common/error-utilities';
import Head from '~/components/Head';
import { Button } from '~/ui/components/Button';
import { H1, P } from '~/ui/components/Text';
import { Navigation } from '~/ui/containers/Navigation';

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
      setTimeout(() => {
        window.location.href = `${this.state.redirectPath}?redirected`;
      }, 1200);
    }
  }

  render() {
    return (
      <>
        <div css={styles.navigationContainer}>
          <Navigation />
        </div>
        <div css={styles.container}>{this._renderContents()}</div>
      </>
    );
  }

  _renderContents = () => {
    if (this.state.redirectPath) {
      return (
        <>
          <img src="/static/images/redirect.svg" css={styles.image} alt="Redirect" />
          <Head title="Redirecting" />
          <H1 css={styles.header}>Redirecting</H1>
          <P css={styles.description}>Just a moment…</P>
        </>
      );
    } else if (this.state.redirectFailed) {
      return (
        <>
          <img src="/static/images/404.svg" css={styles.image} alt="404" />
          <Head title="Not Found" />
          <H1 css={styles.header}>404: Not Found</H1>
          <P css={styles.description} id="__redirect_failed">
            We took an educated guess and tried to direct you to the right page, but it seems that
            did not work out! Maybe it doesn't exist anymore! 😔
          </P>
          <Button href="/">Return Home</Button>
        </>
      );
    } else if (this.state.notFound) {
      return (
        <>
          <img src="/static/images/404.svg" css={styles.image} alt="404" />
          <Head title="Not Found" />
          <H1 css={styles.header}>404: Not Found</H1>
          <P css={styles.description} id="__not_found">
            We couldn't find the page you were looking for. Check the URL to make sure it's correct
            and try again.
          </P>
          <Button href="/">Return Home</Button>
        </>
      );
    } else {
      // Render nothing statically
    }
  };
}

const styles = {
  container: css({
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    flexDirection: 'column',
    backgroundColor: theme.background.canvas,
  }),
  navigationContainer: css({
    position: 'absolute',
    width: '100vw',
    boxSizing: 'border-box',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: theme.border.default,
  }),
  header: css({
    fontSize: 52,
    fontWeight: 700,
  }),
  description: css({
    textAlign: 'center',
    maxWidth: 450,
    marginTop: 24,
    marginBottom: 32,
    lineHeight: '1.7em',
    color: theme.text.secondary,
  }),
  link: css({
    textAlign: 'center',
    marginTop: 20,
  }),
  image: css({ maxWidth: 209, marginBottom: 32 }),
};
