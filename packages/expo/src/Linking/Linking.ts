import Constants from 'expo-constants';
import qs from 'qs';
import { LinkingStatic } from 'react-native';
import URL from 'url-parse';
import { ParsedURL, QueryParams } from './Linking.types';
import Linking from './LinkingModule';

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

function _removeScheme(url: string) {
  return url.replace(/^[a-zA-Z0-9+.-]+:\/\//, '');
}

function _removePort(url: string) {
  return url.replace(/(?=([a-zA-Z0-9+.-]+:\/\/)?[^/]):\d+/, '');
}

function _removeLeadingSlash(url: string) {
  return url.replace(/^\//, '');
}

function _removeTrailingSlash(url: string) {
  return url.replace(/\/$/, '');
}

function _removeTrailingSlashAndQueryString(url: string) {
  return url.replace(/\/?\?.*$/, '');
}

function makeUrl(path: string = '', queryParams: QueryParams = {}): string {
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

  const parsed = URL(url, /* parseQueryString */ true);

  let queryParams = parsed.query;

  let hostUri = HOST_URI || '';
  let hostUriStripped = _removePort(_removeTrailingSlashAndQueryString(hostUri));

  let path = parsed.pathname || null;
  let hostname = parsed.hostname || null;
  let scheme = parsed.protocol || null;

  if (scheme) {
    // Remove colon at end
    scheme = scheme.substring(0, scheme.length - 1);
  }

  if (path) {
    path = _removeLeadingSlash(path);

    let expoPrefix: string | null = null;
    if (hostUriStripped) {
      const parts = hostUriStripped.split('/');
      expoPrefix = `${parts.slice(1).join('/')}/--/`;
    }

    if (IS_EXPO_HOSTED && !USES_CUSTOM_SCHEME && expoPrefix && path.startsWith(expoPrefix)) {
      path = path.substring(expoPrefix.length);
      hostname = null;
    } else if (path.indexOf('+') > -1) {
      path = path.substring(path.indexOf('+') + 1);
    }
  }

  return {
    hostname,
    path,
    queryParams,
    scheme,
  };
}

async function parseInitialURLAsync(): Promise<ParsedURL> {
  const initialUrl = await Linking.getInitialURL();
  if (!initialUrl) {
    return {
      scheme: null,
      hostname: null,
      path: null,
      queryParams: null,
    };
  }

  return parse(initialUrl);
}

interface ExpoLinking extends LinkingStatic {
  makeUrl: typeof makeUrl;
  parse: typeof parse;
  parseInitialURLAsync: typeof parseInitialURLAsync;
}

// @ts-ignore fix this...
let newLinking = new Linking.constructor();

newLinking.makeUrl = makeUrl;
newLinking.parse = parse;
newLinking.parseInitialURLAsync = parseInitialURLAsync;

export default newLinking as ExpoLinking;
