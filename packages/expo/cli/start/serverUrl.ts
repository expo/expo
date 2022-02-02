import assert from 'assert';
import chalk from 'chalk';
import os from 'os';
import QueryString from 'querystring';
import url from 'url';

import * as Log from '../log';
import { CommandError } from '../utils/errors';
import { getIpAddress } from '../utils/ip';
import ProcessSettings from './api/ProcessSettings';
import { getNativeDevServerPort } from './devServer';
import { getNgrokInfo } from './ngrok/ngrokServer';

export interface URLOptions {
  /** URL scheme to use when opening apps in custom runtimes. */
  scheme: string | null;
  /** Type of dev server host to use. */
  hostType: 'localhost' | 'lan' | 'tunnel';
  /** Lan type to use in the dev server. */
  lanType: 'ip' | 'hostname';
  /** Should instruct the bundler to create minified bundles. */
  minify: boolean;

  dev?: boolean;
  urlType: null | 'exp' | 'http' | 'no-protocol' | 'redirect' | 'custom';
}

export interface MetroQueryOptions {
  dev?: boolean;
  minify?: boolean;
}

export const constructBundleUrl = (opts: Partial<URLOptions>, requestHostname?: string) =>
  constructUrl(opts, true, requestHostname);

export const constructManifestUrl = (opts?: Partial<URLOptions>, requestHostname?: string) =>
  constructUrl(opts ?? null, false, requestHostname);

export const constructLogUrl = (requestHostname?: string) =>
  `${constructUrl({ urlType: 'http' }, false, requestHostname)}/logs`;

export const constructLoadingUrl = (platform: 'ios' | 'android', requestHostname?: string) =>
  `${constructUrl({ urlType: 'http' }, false, requestHostname)}/_expo/loading?platform=${platform}`;

export const constructSourceMapUrl = (entryPoint: string, requestHostname?: string) =>
  constructUrlWithExtension(entryPoint, 'map', requestHostname);

const createRedirectUrl = (url: string) => `https://exp.host/--/to-exp/${encodeURIComponent(url)}`;

export const constructDebuggerHost = (requestHostname?: string) =>
  constructUrl({ urlType: 'no-protocol' }, true, requestHostname);

export function constructDeepLink(opts?: Partial<URLOptions>, requestHostname?: string): string {
  if (ProcessSettings.devClient) {
    return constructDevClientUrl(opts, requestHostname);
  } else {
    return constructManifestUrl(opts, requestHostname);
  }
}

export function constructDevClientUrl(opts?: Partial<URLOptions>, requestHostname?: string) {
  let _scheme: string;
  if (opts?.scheme) {
    _scheme = opts?.scheme;
  } else {
    if (!ProcessSettings.scheme || typeof ProcessSettings.scheme !== 'string') {
      throw new CommandError('NO_DEV_CLIENT_SCHEME', 'No scheme specified for development client');
    }
    _scheme = ProcessSettings.scheme;
  }
  const protocol = resolveProtocol({ scheme: _scheme, urlType: 'custom' });
  const manifestUrl = constructManifestUrl({ ...opts, urlType: 'http' }, requestHostname);
  return `${protocol}://expo-development-client/?url=${encodeURIComponent(manifestUrl)}`;
}

// gets the base manifest URL and removes the scheme
export function constructHostUri(requestHostname?: string): string {
  const urlString = constructUrl(null, false, requestHostname);
  // we need to use node's legacy urlObject api since the newer one doesn't like empty protocols
  const urlObj = url.parse(urlString);
  urlObj.protocol = '';
  urlObj.slashes = false;
  return url.format(urlObj);
}

export function constructUrlWithExtension(
  entryPoint: string,
  ext: string,
  requestHostname?: string,
  metroQueryOptions?: MetroQueryOptions
) {
  const defaultOpts = {
    dev: false,
    minify: true,
  };
  metroQueryOptions = metroQueryOptions || defaultOpts;
  let bundleUrl = constructBundleUrl(
    {
      hostType: 'localhost',
      urlType: 'http',
    },
    requestHostname
  );

  const mainModulePath = stripJSExtension(entryPoint);
  bundleUrl += `/${mainModulePath}.${ext}`;

  const queryParams = constructBundleQueryParams(metroQueryOptions);
  return `${bundleUrl}?${queryParams}`;
}

export function constructBundleQueryParams(opts: MetroQueryOptions): string {
  const queryParams: Record<string, boolean | string> = {
    dev: !!opts.dev,
    hot: false,
  };

  if ('minify' in opts) {
    // TODO: Maybe default this to true if dev is false
    queryParams.minify = !!opts.minify;
  }

  return QueryString.stringify(queryParams);
}

export function constructUrl(
  incomingOpts: Partial<URLOptions> | null,
  isPackager: boolean,
  requestHostname?: string
): string {
  const opts = resolveOptions(incomingOpts);

  let protocol = resolveProtocol(opts);

  let hostname;
  let port;

  const proxyURL = isPackager
    ? process.env.EXPO_PACKAGER_PROXY_URL
    : process.env.EXPO_MANIFEST_PROXY_URL;
  if (proxyURL) {
    const parsedProxyURL = url.parse(proxyURL);
    hostname = parsedProxyURL.hostname;
    port = parsedProxyURL.port;
    if (parsedProxyURL.protocol === 'https:') {
      if (protocol === 'http') {
        protocol = 'https';
      }
      if (!port) {
        port = '443';
      }
    }
  } else if (opts.hostType === 'localhost' || requestHostname === 'localhost') {
    hostname = '127.0.0.1';
    port = getNativeDevServerPort();
  } else if (opts.hostType === 'lan' || ProcessSettings.isOffline) {
    // TODO: Drop EXPO_PACKAGER_HOSTNAME and REACT_NATIVE_PACKAGER_HOSTNAME
    if (process.env.EXPO_PACKAGER_HOSTNAME) {
      hostname = process.env.EXPO_PACKAGER_HOSTNAME.trim();
    } else if (process.env.REACT_NATIVE_PACKAGER_HOSTNAME) {
      hostname = process.env.REACT_NATIVE_PACKAGER_HOSTNAME.trim();
    } else if (opts.lanType === 'ip') {
      if (requestHostname) {
        hostname = requestHostname;
      } else {
        hostname = getIpAddress();
      }
    } else {
      // Some old versions of OSX work with hostname but not local ip address.
      hostname = os.hostname();
    }
    port = getNativeDevServerPort();
  } else {
    const ngrokUrl = getNgrokInfo()?.url;
    if (ngrokUrl) {
      const pnu = url.parse(ngrokUrl);
      hostname = pnu.hostname;
      port = pnu.port;
    } else {
      Log.warn(
        chalk.yellow('Tunnel URL not found (it might not be ready yet), falling back to LAN URL.')
      );

      return constructUrl({ ...opts, hostType: 'lan' }, isPackager, requestHostname);
    }
  }

  const url_ = joinURLComponents({ protocol, hostname, port });

  if (opts.urlType === 'redirect') {
    return createRedirectUrl(url_);
  }

  return url_;
}

function joinURLComponents({
  protocol,
  hostname,
  port,
}: {
  protocol?: string | null;
  hostname?: string | null;
  port?: string | number | null;
}): string {
  assert(hostname, 'hostname cannot be inferred.');
  // Android HMR breaks without this port 80.
  // This is because Android React Native WebSocket implementation is not spec compliant and fails without a port:
  // `E unknown:ReactNative: java.lang.IllegalArgumentException: Invalid URL port: "-1"`
  // Invoked first in `metro-runtime/src/modules/HMRClient.js`
  const validPort = port ?? '80';
  const validProtocol = protocol ? `${protocol}://` : '';

  return `${validProtocol}${hostname}:${validPort}`;
}

export function stripJSExtension(entryPoint: string): string {
  return entryPoint.replace(/\.js$/, '');
}

function resolveOptions(opts: Partial<URLOptions> | null): URLOptions {
  return assertValidOptions({
    urlType: null,
    hostType: ProcessSettings.hostType,
    scheme: ProcessSettings.scheme,
    minify: ProcessSettings.minify,
    lanType: ProcessSettings.lanType,
    dev: ProcessSettings.isDevMode,
    ...opts,
  });
}

function resolveProtocol({
  urlType,
  ...options
}: Pick<URLOptions, 'urlType' | 'scheme'>): string | null {
  if (urlType === 'http') {
    return 'http';
  } else if (urlType === 'no-protocol') {
    return null;
  } else if (urlType === 'custom') {
    return options.scheme;
  }
  return 'exp';
}

function assertValidOptions(opts: Partial<URLOptions>): URLOptions {
  if (opts.scheme && typeof opts.scheme !== 'string') {
    throw new CommandError('INVALID_OPTIONS', `"scheme" must be a string if specified`);
  }

  const optionalEnums: [string, string[]][] = [
    ['urlType', [null, 'exp', 'http', 'redirect', 'no-protocol']],
    ['lanType', ['ip', 'hostname']],
    ['hostType', ['localhost', 'lan', 'tunnel']],
  ];

  for (const [key, values] of optionalEnums) {
    if (opts[key] && !values.includes(opts[key])) {
      throw new CommandError(
        'INVALID_OPTIONS',
        `"${key}" must be one of: ${values.join(', ')} if specified`
      );
    }
  }

  for (const key of ['devClient', 'dev', 'minify', 'https']) {
    if (opts[key] !== undefined && typeof opts[key] !== 'boolean') {
      throw new CommandError('INVALID_OPTIONS', `"${key}" must be a boolean if specified`);
    }
  }

  Object.keys(opts).forEach((key) => {
    if (
      !['devClient', 'scheme', 'urlType', 'lanType', 'hostType', 'dev', 'minify', 'https'].includes(
        key
      )
    ) {
      throw new CommandError('INVALID_OPTIONS', `"${key}" is not a valid option`);
    }
  });

  return opts as URLOptions;
}
