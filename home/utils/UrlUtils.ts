import url from 'url';

import Config from '../api/Config';

const HTTPS_HOSTS = [Config.api.host, 'exp.host', 'exponentjs.com', 'getexponent.com'];

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
  components.protocol = components.protocol === 'https:' ? 'exps:' : 'exp:';
  return url.format(components);
}

export function conformsToExpoProtocol(str: string): boolean {
  if (!str) {
    return false;
  }

  // @username/experience
  if (str.match(/^@\w+\/\w+/)) {
    return true;
  } else if (str.startsWith('exp://') || str.startsWith('exps://')) {
    return true;
  } else if (
    str.startsWith(`${Config.website.origin}/`) ||
    str.startsWith(`${Config.api.origin}/`)
  ) {
    return true;
  }

  return false;
}
