import assert from 'assert';
import chalk from 'chalk';
import QueryString from 'querystring';
import url from 'url';

import * as Log from '../../log';
import { CommandError } from '../../utils/errors';
import { getIpAddress } from '../../utils/ip';

export interface URLOptions {
  /** URL scheme to use when opening apps in custom runtimes. */
  scheme: string | null;
  /** Type of dev server host to use. */
  hostType: 'localhost' | 'lan' | 'tunnel';
  /** Should instruct the bundler to create minified bundles. */
  minify: boolean;

  mode?: 'production' | 'development';

  urlType: null | 'exp' | 'http' | 'no-protocol' | 'custom';

  isOffline?: boolean;
}

export interface MetroQueryOptions {
  dev?: boolean;
  /** Should instruct the bundler to create minified bundles. */
  minify: boolean;
}

export class UrlCreator {
  constructor(
    private defaults: Partial<URLOptions>,
    private bundlerInfo: { port: number; getTunnelUrl?: () => string }
  ) {}

  constructBundleUrl = (opts: Partial<URLOptions>, requestHostname?: string) =>
    this.constructUrl(opts, true, requestHostname);

  constructManifestUrl = (opts?: Partial<URLOptions>, requestHostname?: string) =>
    this.constructUrl(opts ?? null, false, requestHostname);

  constructLogUrl = (requestHostname?: string) =>
    `${this.constructUrl({ urlType: 'http' }, false, requestHostname)}/logs`;

  constructLoadingUrl = (platform: string, requestHostname?: string) =>
    `${this.constructUrl(
      { urlType: 'http' },
      false,
      requestHostname
    )}/_expo/loading?platform=${platform}`;

  constructDebuggerHost = (requestHostname?: string) =>
    this.constructUrl({ urlType: 'no-protocol' }, true, requestHostname);

  constructDevClientUrl(opts?: Partial<URLOptions>, requestHostname?: string) {
    let _scheme: string;
    if (opts?.scheme) {
      _scheme = opts?.scheme;
    } else {
      if (!this.defaults.scheme || typeof this.defaults.scheme !== 'string') {
        throw new CommandError(
          'NO_DEV_CLIENT_SCHEME',
          'No scheme specified for development client'
        );
      }
      _scheme = this.defaults.scheme;
    }
    const protocol = resolveProtocol({ scheme: _scheme, urlType: 'custom' });
    const manifestUrl = this.constructManifestUrl({ ...opts, urlType: 'http' }, requestHostname);
    return `${protocol}://expo-development-client/?url=${encodeURIComponent(manifestUrl)}`;
  }

  // gets the base manifest URL and removes the scheme
  constructHostUri(requestHostname?: string): string {
    const urlString = this.constructUrl(null, false, requestHostname);
    // we need to use node's legacy urlObject api since the newer one doesn't like empty protocols
    const urlObj = url.parse(urlString);
    urlObj.protocol = '';
    urlObj.slashes = false;
    return url.format(urlObj);
  }

  resolveOptions(opts: Partial<URLOptions> | null): URLOptions {
    return assertValidOptions({
      urlType: null,
      ...this.defaults,

      ...opts,
    });
  }

  constructBundleQueryParams(opts: MetroQueryOptions): string {
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

  constructUrl(
    incomingOpts: Partial<URLOptions> | null,
    isPackager: boolean,
    requestHostname?: string
  ): string {
    const opts = this.resolveOptions(incomingOpts);

    let protocol = resolveProtocol(opts);

    let hostname;
    let port;

    const proxyURL = getProxyUrl(isPackager);
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
      port = this.bundlerInfo.port;
    } else if (opts.hostType === 'lan' || this.defaults.isOffline) {
      // TODO: Drop EXPO_PACKAGER_HOSTNAME and REACT_NATIVE_PACKAGER_HOSTNAME
      if (process.env.EXPO_PACKAGER_HOSTNAME) {
        hostname = process.env.EXPO_PACKAGER_HOSTNAME.trim();
      } else if (process.env.REACT_NATIVE_PACKAGER_HOSTNAME) {
        hostname = process.env.REACT_NATIVE_PACKAGER_HOSTNAME.trim();
      } else if (requestHostname) {
        hostname = requestHostname;
      } else {
        hostname = getIpAddress();
      }
      port = this.bundlerInfo.port;
    } else {
      if (this.bundlerInfo.getTunnelUrl()) {
        const pnu = url.parse(this.bundlerInfo.getTunnelUrl());
        hostname = pnu.hostname;
        port = pnu.port;
      } else {
        Log.warn(
          chalk.yellow('Tunnel URL not found (it might not be ready yet), falling back to LAN URL.')
        );

        return this.constructUrl({ ...opts, hostType: 'lan' }, isPackager, requestHostname);
      }
    }

    return joinURLComponents({ protocol, hostname, port });
  }
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
  assert(opts.minify == null || typeof opts.minify === 'boolean', `"minify" must be a boolean`);
  assert(
    opts.isOffline == null || typeof opts.isOffline === 'boolean',
    `"isOffline" must be a boolean`
  );
  assert(opts.scheme == null || typeof opts.scheme === 'string', `"scheme" must be a string`);
  if (!opts.urlType != null) assert.match(opts.urlType, /^(exp|http|no-protocol)$/);
  if (!opts.hostType != null) assert.match(opts.hostType, /^(localhost|lan|tunnel)$/);
  if (!opts.mode != null) assert.match(opts.mode, /^(development|production)$/);

  return opts as URLOptions;
}

/** @deprecated */
function getProxyUrl(isPackager: boolean): string | undefined {
  return isPackager ? process.env.EXPO_PACKAGER_PROXY_URL : process.env.EXPO_MANIFEST_PROXY_URL;
}

// TODO: Drop the undocumented env variables:
// EXPO_PACKAGER_HOSTNAME
// REACT_NATIVE_PACKAGER_HOSTNAME
// EXPO_PACKAGER_PROXY_URL
// EXPO_MANIFEST_PROXY_URL
