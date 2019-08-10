import React from 'react';
import * as Sentry from '@sentry/browser';
import navigation from '~/common/navigation';

const REDIRECT_SUFFIX = '?redirected';

export default class Error extends React.Component {
  static getInitialProps({ res, err }) {
    const statusCode = res ? res.statusCode : err ? err.statusCode : null;
    return { statusCode };
  }

  state = {
    notFound: false,
    redirectPath: null,
    redirectFailed: false,
  };

  componentDidMount() {
    let location;

    if (typeof window === 'undefined') {
      return;
    }

    let { pathname, search } = window.location;

    if (window.location.search === REDIRECT_SUFFIX) {
      this.setState({ redirectFailed: true });
      return;
    }

    if (isValidPath(pathname)) {
      let redirectPath;

      if (pathIncludesHtmlExtension(pathname)) {
        redirectPath = pathname.replace('.html', '');
      } else if (!isVersionDocumented(pathname)) {
        redirectPath = replaceVersionWithLatest(pathname);
      }

      // Add that all important trailing slash
      if (redirectPath[redirectPath.length - 1] !== '/') {
        redirectPath = `${redirectPath}/`;
      }

      if (redirectPath) {
        this.setState({ redirectPath });
        return;
      }
    }

    // We are confident now that we can render a not found error
    this.setState({ notFound: true });
    Sentry.captureMessage(`Page not found (404)`);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.redirectPath !== this.state.redirectPath && typeof window !== 'undefined') {
      Sentry.configureScope(scope => {
        scope.setExtra('originalPath', window.location.pathname);
        scope.setExtra('redirectPath', this.state.redirectPath);
      });
      Sentry.captureMessage(`Redirect handled`);

      // Let people actually read the carefully crafted message and absorb the
      // cool emoji selection, they can just click through if they want speed
      setTimeout(() => {
        window.location = `${this.state.redirectPath}?redirected`;
      }, 2500);
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
        textAlign: 'center',
        maxWidth: 450,
        marginHorizontal: 30,
        lineHeight: '1.7em',
      },
      link: {
        textAlign: 'center',
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
            <a href="/">Click here to possibly go there more quickly!</a>
          </p>
        </>
      );
    } else if (this.state.redirectFailed) {
      return (
        <>
          <h1>🏳️</h1>
          <p style={styles.description}>
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
          <p style={styles.description}>
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
      return;
    }
  };
}

// Filter unversioned and latest out, so we end up with v34, etc.
let supportedVersions = Object.keys(navigation).filter(v => v.match(/^v/));

// Return true if the version is still included in documentation
function isVersionDocumented(path) {
  let pathParts = path.split(/\//);
  //  eg: ["", "versions", "v32.0.0", ""]
  let version = pathParts[2];
  if (supportedVersions.includes(version)) {
    return true;
  } else {
    return false;
  }
}

function pathIncludesHtmlExtension(path) {
  return !!path.match(/\.html$/);
}

const VERSION_PART_PATTERN = `(v\\d+\\.\\d+\.\\d+)|latest|unversioned`;
const VALID_PATH_PATTERN = `^\\/versions\\/${VERSION_PART_PATTERN}`;

// Check if path is valid (matches /versions/some-valid-version-here/)
function isValidPath(path) {
  return !!path.match(new RegExp(VALID_PATH_PATTERN));
}

// Replace an unsupported SDK version with latest
function replaceVersionWithLatest(path) {
  return path.replace(new RegExp(VERSION_PART_PATTERN), 'latest');
}
