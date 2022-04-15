import assert from 'assert';
import { URL } from 'url';

import * as Log from '../../log';
import { getIpAddress } from '../../utils/ip';

const debug = require('debug')('expo:start:server:urlCreator') as typeof console.log;

export interface CreateURLOptions {
  /** URL scheme to use when opening apps in custom runtimes. */
  scheme?: string | null;
  /** Type of dev server host to use. */
  hostType?: 'localhost' | 'lan' | 'tunnel';
  /** Requested hostname. */
  hostname?: string | null;
}

interface UrlComponents {
  port: string;
  hostname: string;
  protocol: string;
}
export class UrlCreator {
  constructor(
    private defaults: CreateURLOptions,
    private bundlerInfo: { port: number; getTunnelUrl?: () => string | null }
  ) {}

  /**
   * @returns URL like `http://localhost:19000/_expo/loading?platform=ios`
   */
  public constructLoadingUrl(options: CreateURLOptions, platform: string): string {
    const url = new URL('_expo/loading', this.constructUrl({ scheme: 'http', ...options }));
    url.search = new URLSearchParams({ platform }).toString();
    const loadingUrl = url.toString();
    debug(`Loading URL: ${loadingUrl}`);
    return loadingUrl;
  }

  /** Create a URI for launching in a native dev client. Returns `null` when no `scheme` can be resolved. */
  public constructDevClientUrl(options?: CreateURLOptions): null | string {
    const protocol = options?.scheme || this.defaults.scheme;

    if (
      !protocol ||
      // Prohibit the use of http(s) in dev client URIs since they'll never be valid.
      ['http', 'https'].includes(protocol.toLowerCase())
    ) {
      return null;
    }

    const manifestUrl = this.constructUrl({ ...options, scheme: 'http' });
    const devClientUrl = `${protocol}://expo-development-client/?url=${encodeURIComponent(
      manifestUrl
    )}`;
    debug(`Dev client URL: ${devClientUrl} -- manifestUrl: ${manifestUrl} -- %O`, options);
    return devClientUrl;
  }

  /** Create a generic URL. */
  public constructUrl(options?: Partial<CreateURLOptions> | null): string {
    const urlComponents = this.getUrlComponents({
      ...this.defaults,
      ...options,
    });
    const url = joinUrlComponents(urlComponents);
    debug(`URL: ${url}`);
    return url;
  }

  /** Get the URL components from the Ngrok server URL. */
  private getTunnelUrlComponents(options: Pick<CreateURLOptions, 'scheme'>): UrlComponents | null {
    const tunnelUrl = this.bundlerInfo.getTunnelUrl?.();
    if (!tunnelUrl) {
      return null;
    }
    const parsed = new URL(tunnelUrl);
    return {
      port: parsed.port,
      hostname: parsed.hostname,
      protocol: options.scheme ?? 'http',
    };
  }

  private getUrlComponents(options: CreateURLOptions): UrlComponents {
    // Proxy comes first.
    const proxyURL = getProxyUrl();
    if (proxyURL) {
      return getUrlComponentsFromProxyUrl(options, proxyURL);
    }

    // Ngrok.
    if (options.hostType === 'tunnel') {
      const components = this.getTunnelUrlComponents(options);
      if (components) {
        return components;
      }
      Log.warn('Tunnel URL not found (it might not be ready yet), falling back to LAN URL.');
    } else if (options.hostType === 'localhost' && !options.hostname) {
      options.hostname = 'localhost';
    }

    return {
      hostname: getDefaultHostname(options),
      port: this.bundlerInfo.port.toString(),
      protocol: options.scheme ?? 'http',
    };
  }
}

function getUrlComponentsFromProxyUrl(
  options: Pick<CreateURLOptions, 'scheme'>,
  url: string
): UrlComponents {
  const parsedProxyUrl = new URL(url);
  let protocol = options.scheme ?? 'http';
  if (parsedProxyUrl.protocol === 'https:') {
    if (protocol === 'http') {
      protocol = 'https';
    }
    if (!parsedProxyUrl.port) {
      parsedProxyUrl.port = '443';
    }
  }
  return {
    port: parsedProxyUrl.port,
    hostname: parsedProxyUrl.hostname,
    protocol,
  };
}

function getDefaultHostname(options: Pick<CreateURLOptions, 'hostname'>) {
  // TODO: Drop REACT_NATIVE_PACKAGER_HOSTNAME
  if (process.env.REACT_NATIVE_PACKAGER_HOSTNAME) {
    return process.env.REACT_NATIVE_PACKAGER_HOSTNAME.trim();
  } else if (options.hostname === 'localhost') {
    // Restrict the use of `localhost`
    // TODO: Note why we do this.
    return '127.0.0.1';
  }

  return options.hostname || getIpAddress();
}

function joinUrlComponents({ protocol, hostname, port }: Partial<UrlComponents>): string {
  assert(hostname, 'hostname cannot be inferred.');
  // Android HMR breaks without this port 80.
  // This is because Android React Native WebSocket implementation is not spec compliant and fails without a port:
  // `E unknown:ReactNative: java.lang.IllegalArgumentException: Invalid URL port: "-1"`
  // Invoked first in `metro-runtime/src/modules/HMRClient.js`
  const validPort = port || '80';
  const validProtocol = protocol ? `${protocol}://` : '';

  return `${validProtocol}${hostname}:${validPort}`;
}

/** @deprecated */
function getProxyUrl(): string | undefined {
  return process.env.EXPO_PACKAGER_PROXY_URL;
}

// TODO: Drop the undocumented env variables:
// REACT_NATIVE_PACKAGER_HOSTNAME
// EXPO_PACKAGER_PROXY_URL
