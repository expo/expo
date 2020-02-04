import Constants from 'expo-constants';
import qs from 'qs';

const { manifest } = Constants;

const USES_CUSTOM_SCHEME = Constants.appOwnership === 'standalone' && manifest.scheme;

let HOST_URI = manifest.hostUri;
if (!HOST_URI && !USES_CUSTOM_SCHEME) {
  // we're probably not using up-to-date xdl, so just fake it for now
  // we have to remove the /--/ on the end since this will be inserted again later
  HOST_URI = _removeScheme(Constants.linkingUri).replace(/\/--($|\/.*$)/, '');
}

const IS_EXPO_HOSTED =
  HOST_URI &&
  (/^(.*\.)?(expo\.io|exp\.host|exp\.direct|expo\.test)(:.*)?(\/.*)?$/.test(HOST_URI) ||
    manifest.developer);

export function makeSessionUrl(
  path: string = '',
  queryParams: { [key: string]: string | undefined } = {}
): string {
  let scheme = 'exp';
  let manifestScheme = manifest.scheme || (manifest.detach && manifest.detach.scheme);

  if (Constants.appOwnership === 'standalone' && manifestScheme) {
    scheme = manifestScheme;
  } else if (Constants.appOwnership === 'standalone' && !manifestScheme) {
    throw new Error('Cannot make a deep link into a standalone app with no custom scheme defined');
  } else if (Constants.appOwnership === 'expo' && !manifestScheme) {
    console.warn(
      'Linking requires that you provide a `scheme` in app.json for standalone apps - if it is left blank, your app may crash. The scheme does not apply to development in the Expo client but you should add it as soon as you start working with Linking to avoid creating a broken build. Add a `scheme` to silence this warning. Learn more about Linking at https://docs.expo.io/versions/latest/workflow/linking/'
    );
  }

  let hostUri = HOST_URI || '';
  if (USES_CUSTOM_SCHEME && IS_EXPO_HOSTED) {
    hostUri = '';
  }

  if (path) {
    if (IS_EXPO_HOSTED && hostUri) {
      path = `/--/${_removeLeadingSlash(path)}`;
    }

    if (!path.startsWith('/')) {
      path = `/${path}`;
    }
  } else {
    path = '';
  }

  // merge user-provided query params with any that were already in the hostUri
  // e.g. release-channel
  let queryString = '';
  let queryStringMatchResult = hostUri.match(/(.*)\?(.+)/);
  if (queryStringMatchResult) {
    hostUri = queryStringMatchResult[1];
    queryString = queryStringMatchResult[2];
    let paramsFromHostUri = {};
    try {
      let parsedParams = qs.parse(queryString);
      if (typeof parsedParams === 'object') {
        paramsFromHostUri = parsedParams;
      }
    } catch (e) {}
    queryParams = {
      ...queryParams,
      ...paramsFromHostUri,
    };
  }
  queryString = qs.stringify(queryParams);
  if (queryString) {
    queryString = `?${queryString}`;
  }

  hostUri = _removeTrailingSlash(hostUri);

  return encodeURI(`${scheme}://${hostUri}${path}${queryString}`);
}

function _removeScheme(url: string) {
  return url.replace(/^[a-zA-Z0-9+.-]+:\/\//, '');
}

function _removeLeadingSlash(url: string) {
  return url.replace(/^\//, '');
}

function _removeTrailingSlash(url: string) {
  return url.replace(/\/$/, '');
}
