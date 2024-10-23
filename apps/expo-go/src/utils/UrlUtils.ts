import url from 'url';

import Environment from './Environment';
import Config from '../api/Config';

const HTTPS_HOSTS = [Config.api.host, 'exp.host', 'exponentjs.com', 'getexponent.com'];

// This is mostly copied from https://github.com/expo/snack/blob/main/packages/snack-content/src/urls.ts
export const SNACK_RUNTIME_URL_ENDPOINT = 'u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824';
export const SNACK_RUNTIME_URL_PROTOCOL = 'exp';

export function normalizeSnackUrl(fullName: string): string {
  const parameters = new URLSearchParams();

  // Pretty sure we need to pass in the SDK version that the Snack supports here, rather than just
  // the SDK version that Expo Go supports.
  parameters.set('runtime-version', `exposdk:${Environment.supportedSdksString}.0.0`);
  parameters.set('channel-name', 'production');
  parameters.set('snack', fullName);

  return `${SNACK_RUNTIME_URL_PROTOCOL}://${SNACK_RUNTIME_URL_ENDPOINT}?${parameters}`;
}

export function normalizeUrl(rawUrl: string): string {
  let components = url.parse(rawUrl, false, true);
  if (
    components.protocol === 'localhost:' ||
    (components.host == null && !components.protocol && !components.slashes)
  ) {
    if (components.path && components.path.charAt(0) === '@') {
      // try parsing as @user/experience-id shortcut
      components = url.parse(`exp://${Config.api.host}/${rawUrl}`);
    } else {
      // just treat it as a url with no protocol and assume exp://
      components = url.parse('exp://' + rawUrl);
    }
  }
  if (!components.protocol) {
    components.protocol = 'exp:';
    components.slashes = true;
  }
  return url.format(components);
}

export function toHttp(expUrl: string): string {
  if (!(expUrl.startsWith('exp:') || expUrl.startsWith('exps:'))) {
    return expUrl;
  }

  const components = url.parse(expUrl);
  if (components.host && HTTPS_HOSTS.includes(components.host)) {
    components.protocol = 'https:';
  } else {
    components.protocol = 'http:';
  }
  return url.format(components);
}

export function toExp(httpUrl: string): string {
  const components = url.parse(httpUrl);
  components.protocol = 'exp:';
  return url.format(components);
}

export function toExps(httpUrl: string): string {
  const components = url.parse(httpUrl);
  components.protocol = 'exps:';
  return url.format(components);
}

export function conformsToExpoProtocol(str: string): boolean {
  if (!str) {
    return false;
  }

  // @username/experience
  if (str.match(/^@\w+\/\w+/)) {
    return true;
  } else if (str.startsWith('exp://')) {
    return true;
  } else if (
    str.startsWith(`${Config.website.origin}/`) ||
    str.startsWith(`${Config.api.origin}/`)
  ) {
    return true;
  }

  return false;
}
