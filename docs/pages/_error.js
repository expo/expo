import * as Sentry from '@sentry/browser';
import React from 'react';

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

    // Remove versioning from path if this section is no longer versioned
    if (isVersionedPath(redirectPath) && !pathRequiresVersioning(redirectPath)) {
      redirectPath = removeVersionFromPath(redirectPath);
    }

    if (redirectPath !== pathname) {
      this.setState({ redirectPath });
      return;
    }

    // We are confident now that we can render a not found error
    this.setState({ notFound: true });
    Sentry.captureMessage(`Page not found (404)`);
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.redirectPath !== this.state.redirectPath && typeof window !== 'undefined') {
      // Let people actually read the carefully crafted message and absorb the
      // cool emoji selection, they can just click through if they want speed
      setTimeout(() => {
        window.location = `${this.state.redirectPath}?redirected`;
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

// Filter unversioned and latest out, so we end up with v34, etc.
const supportedVersions = Object.keys(navigation).filter(v => v.match(/^v/));

// Return true if the version is still included in documentation
function isVersionDocumented(path) {
  const pathParts = path.split(/\//);
  //  eg: ["", "versions", "v32.0.0", ""]
  const version = pathParts[2];
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

const VERSION_PART_PATTERN = `(latest|unversioned|v\\d+\\.\\d+\.\\d+)`;
const VERSIONED_PATH_PATTERN = `^\\/versions\\/${VERSION_PART_PATTERN}`;
const SDK_PATH_PATTERN = `${VERSIONED_PATH_PATTERN}/sdk`;

// Check if path is valid (matches /versions/some-valid-version-here/)
function isVersionedPath(path) {
  return !!path.match(new RegExp(VERSIONED_PATH_PATTERN));
}

// Replace an unsupported SDK version with latest
function replaceVersionWithLatest(path) {
  return path.replace(new RegExp(VERSION_PART_PATTERN), 'latest');
}

function pathRequiresVersioning(path) {
  return path.match(new RegExp(SDK_PATH_PATTERN));
}

function removeVersionFromPath(path) {
  return path.replace(new RegExp(VERSIONED_PATH_PATTERN), '');
}

// Not sure why this happens but sometimes the URL ends in /null
function endsInNull(path) {
  return !!path.match(/\/null$/);
}

// Simple remapping of renamed pages, similar to in deploy.sh but in some cases,
// for reasons I'm not totally clear on, those redirects do not work
const RENAMED_PAGES = {
  '/introduction/project-lifecycle/': '/introduction/managed-vs-bare/',
  '/guides/': '/workflow/exploring-managed-workflow/',
  '/versions/latest/sdk/': '/versions/latest/sdk/overview/',
  '/guides/building-standalone-apps/': '/distribution/building-standalone-apps/',
  '/guides/genymotion/': '/workflow/android-studio-emulator/',
  '/workflow/upgrading-expo/': '/workflow/upgrading-expo-sdk-walkthrough/',
  '/workflow/create-react-native-app/': '/workflow/glossary-of-terms/#create-react-native-app',
  '/expokit/': '/expokit/overview/',
  '/guides/detach/': '/expokit/eject/',
  '/expokit/detach/': '/expokit/eject/',

  // Lots of old links pointing to guides when they have moved elsewhere
  '/guides/configuration/': '/workflow/configuration/',
  '/guides/expokit/': '/expokit/overview/',
  '/guides/publishing/': '/workflow/publishing/',
  '/guides/linking/': '/vworkflow/linking/',
  '/guides/up-and-running/': '/workflow/up-and-running/',
  '/guides/debugging/': '/workflow/debugging/',
  '/guides/logging/': '/workflow/logging/',
  '/introduction/troubleshooting-proxies/': '/guides/troubleshooting-proxies/',
  '/introduction/running-in-the-browser/': '/guides/running-in-the-browser/',

  // Changes from redoing the getting started workflow, SDK35+
  '/workflow/up-and-running/': '/get-started/installation/',
  '/introduction/additional-resources/': '/next-steps/additional-resources/',
  '/introduction/already-used-react-native/': '/workflow/already-used-react-native/',
  '/introduction/community/': '/next-steps/community/',
  '/introduction/installation/': '/get-started/installation/',
  '/versions/latest/overview/': '/versions/latest/',
  '/workflow/exploring-managed-workflow/': '/introduction/walkthrough/',

  // Move overview to index
  '/versions/v37.0.0/sdk/overview/': '/versions/v37.0.0/sdk/',
  '/versions/latest/sdk/overview/': '/versions/latest/sdk/',
};
