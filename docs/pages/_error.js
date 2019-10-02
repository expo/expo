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
      Sentry.captureMessage(`Redirect failed`);
      this.setState({ redirectFailed: true });
      return;
    }

    if (isValidPath(pathname)) {
      let redirectPath = pathname;

      // index.html is no longer a thing in our docs
      if (pathIncludesIndexHtml(redirectPath)) {
        redirectPath = redirectPath.replace('index.html', '');
      }

      // Remove the .html extension if it is included in the path
      if (pathIncludesHtmlExtension(redirectPath)) {
        redirectPath = redirectPath.replace('.html', '');
      }

      // Unsure why this is happening, but sometimes URLs end up with /null in
      // the last path part
      // https://docs.expo.io/versions/latest/sdk/overview/null
      if (endsInNull(redirectPath)) {
        redirectPath = redirectPath.replace(/null$/, '');
      }

      // Add a trailing slash if there is not one
      if (redirectPath[redirectPath.length - 1] !== '/') {
        redirectPath = `${redirectPath}/`;
      }

      // A list of pages we know are renamed and can redirect
      if (RENAMED_PAGES[redirectPath]) {
        redirectPath = RENAMED_PAGES[redirectPath];
      }

      // Check if the version is documented, replace it with latest if not
      if (!isVersionDocumented(redirectPath)) {
        redirectPath = replaceVersionWithLatest(redirectPath);
      }

      if (redirectPath !== pathname) {
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
      }, 2000);
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
            <a href={this.state.redirectPath}>Click here to possibly go there more quickly!</a>
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

function pathIncludesIndexHtml(path) {
  return !!path.match(/index\.html$/);
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

// Not sure why this happens but sometimes the URL ends in /null
function endsInNull(path) {
  return !!path.match(/\/null$/);
}

// Simple remapping of renamed pages, similar to in deploy.sh but in some cases,
// for reasons I'm not totally clear on, those redirects do not work
const RENAMED_PAGES = {
  '/versions/latest/introduction/project-lifecycle/':
    '/versions/latest/introduction/managed-vs-bare/',
  '/versions/latest/guides/': '/versions/latest/workflow/exploring-managed-workflow/',
  '/versions/latest/sdk/': '/versions/latest/sdk/overview/',
  '/versions/latest/guides/building-standalone-apps/':
    '/versions/latest/distribution/building-standalone-apps/',
  '/versions/latest/guides/genymotion/': '/versions/latest/workflow/android-studio-emulator/',
  '/versions/latest/workflow/upgrading-expo/':
    '/versions/latest/workflow/upgrading-expo-sdk-walkthrough/',
  '/versions/latest/workflow/create-react-native-app/':
    'versions/latest/workflow/glossary-of-terms/#create-react-native-app',
  '/versions/latest/expokit/': '/versions/latest/expokit/overview/',
  '/versions/latest/guides/detach/': '/versions/latest/expokit/eject/',
  '/versions/latest/expokit/detach/': '/versions/latest/expokit/eject/',
  // Lots of old links pointing to guides when they have moved elsewhere
  '/versions/latest/guides/configuration/': '/versions/latest/workflow/configuration/',
  '/versions/latest/guides/expokit/': '/versions/latest/expokit/overview/',
  '/versions/latest/guides/publishing/': '/versions/latest/workflow/publishing/',
  '/versions/latest/guides/linking/': '/versions/latest/workflow/linking/',
  '/versions/latest/guides/up-and-running/': '/versions/latest/workflow/up-and-running/',
  '/versions/latest/guides/debugging/': '/versions/latest/workflow/debugging/',
  '/versions/latest/guides/logging/': '/versions/latest/workflow/logging/',
  '/versions/latest/introduction/troubleshooting-proxies/':
    '/versions/latest/guides/troubleshooting-proxies/',
  '/versions/latest/introduction/running-in-the-browser/':
    '/versions/latest/guides/running-in-the-browser/',
};
