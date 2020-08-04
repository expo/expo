import url from 'url';

const HTTPS_HOSTS = ['exp.host', 'exponentjs.com', 'getexponent.com'];

export function normalizeUrl(rawUrl: string): string {
  let components = url.parse(rawUrl, false, true);
  if (
    components.protocol === 'localhost:' ||
    (components.host == null && !components.protocol && !components.slashes)
  ) {
    if (components.path && components.path.charAt(0) === '@') {
      // try parsing as @user/experience-id shortcut
      components = url.parse('exp://exp.host/' + rawUrl);
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

  let components = url.parse(expUrl);
  if (components.host && HTTPS_HOSTS.includes(components.host)) {
    components.protocol = 'https:';
  } else {
    components.protocol = 'http:';
  }
  return url.format(components);
}

export function toExp(httpUrl: string): string {
  let components = url.parse(httpUrl);
  components.protocol = 'exp:';
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
  } else if (str.startsWith('https://expo.io/') || str.startsWith('https://exp.host/')) {
    return true;
  }

  return false;
}
