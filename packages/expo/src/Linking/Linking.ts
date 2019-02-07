import Constants from 'expo-constants';
import qs from 'qs';

import { ParsedURL } from './Linking.types';
import Linking from './LinkingModule';

const { manifest } = Constants;

const USES_CUSTOM_SCHEME = Constants.appOwnership === 'standalone' && manifest && manifest.scheme;

let HOST_URI = manifest ? manifest.hostUri : null;
if (!HOST_URI && !USES_CUSTOM_SCHEME && Constants.linkingUri) {
  // we're probably not using up-to-date xdl, so just fake it for now
  // we have to remove the /--/ on the end since this will be inserted again later
  HOST_URI = _removeScheme(Constants.linkingUri).replace(/\/--($|\/.*$)/, '');
}
const IS_EXPO_HOSTED =
  HOST_URI &&
  (/^(.*\.)?(expo\.io|exp\.host|exp\.direct|expo\.test)(:.*)?(\/.*)?$/.test(HOST_URI) ||
    manifest.developer);

function _removeScheme(url) {
  return url.replace(/^[a-zA-Z0-9+.-]+:\/\//, '');
}

function _removePort(url) {
  return url.replace(/(?=([a-zA-Z0-9+.-]+:\/\/)?[^/]):\d+/, '');
}

function _removeLeadingSlash(url) {
  return url.replace(/^\//, '');
}

function _removeTrailingSlash(url) {
  return url.replace(/\/$/, '');
}

function _removeTrailingSlashAndQueryString(url) {
  return url.replace(/\/?\?.*$/, '');
}

function makeUrl(path: string = '', queryParams: Object = {}): string {
  let scheme = 'exp';
  if (Constants.appOwnership === 'standalone') {
    scheme = manifest.scheme || (manifest.detach && manifest.detach.scheme);
  }
  if (!scheme) {
    throw new Error('Cannot make a deep link into a standalone app with no custom scheme defined');
  }

  let hostUri = HOST_URI || '';
  if (USES_CUSTOM_SCHEME && IS_EXPO_HOSTED) {
    hostUri = '';
  }

  if (path) {
    if (IS_EXPO_HOSTED && hostUri) {
      path = `/--/${_removeLeadingSlash(path)}`;
    }

    if (!path.startsWith('/') && hostUri) {
      path = `/${path}`;
    } else if (path.startsWith('/') && !hostUri) {
      path = path.substr(1);
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

function parse(url: string): ParsedURL {
  if (!url) {
    throw new Error('parse cannot be called with a null value');
  }
  // iOS client sometimes strips out the port from the initial URL
  // even when it's included in the hostUri.
  // This function should be able to handle both cases, so we strip off the port
  // both here and from the hostUri.
  let decodedUrl = _removePort(decodeURI(url));
  let path: string;
  let queryParams = {};

  let queryStringMatchResult = decodedUrl.match(/(.*)\?(.+)/);
  if (queryStringMatchResult) {
    decodedUrl = queryStringMatchResult[1];
    queryParams = qs.parse(queryStringMatchResult[2]);
  }

  // strip off the hostUri from the host and path
  let hostUri = HOST_URI || '';
  let hostUriStripped = _removePort(_removeTrailingSlashAndQueryString(hostUri));
  if (hostUriStripped && decodedUrl.indexOf(hostUriStripped) > -1) {
    path = decodedUrl.substr(decodedUrl.indexOf(hostUriStripped) + hostUriStripped.length);
  } else {
    path = _removeScheme(decodedUrl);
  }

  path = _removeLeadingSlash(path);

  if (IS_EXPO_HOSTED && !USES_CUSTOM_SCHEME && path.startsWith('--/')) {
    path = path.substr(3);
  } else if (path.indexOf('+') > -1) {
    path = path.substr(path.indexOf('+') + 1);
  }

  return { path, queryParams };
}

async function parseInitialURLAsync(): Promise<ParsedURL> {
  const initialUrl = await Linking.getInitialURL();
  if (!initialUrl) {
    return {
      path: null,
      queryParams: null,
    };
  }

  return parse(initialUrl);
}

// @ts-ignore fix this...
let newLinking = new Linking.constructor();

newLinking.makeUrl = makeUrl;
newLinking.parse = parse;
newLinking.parseInitialURLAsync = parseInitialURLAsync;

export default newLinking;
