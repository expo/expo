import assert from 'assert';
import { URL } from 'url';

import * as Log from '../../log';
import { getIpAddress } from '../../utils/ip';

export interface CreateURLOptions {
  /** URL scheme to use when opening apps in custom runtimes. */
  scheme?: string | null;
  /** Type of dev server host to use. */
  hostType?: 'localhost' | 'lan' | 'tunnel';
  /** Requested hostname. */
  hostname?: string;
}

export class UrlCreator {
  constructor(
    private defaults: CreateURLOptions,
    private bundlerInfo: { port: number; getTunnelUrl?: () => string }
  ) {}

  /**
   * @returns URL like `http://localhost:19000/_expo/loading?platform=ios`
   */
  public constructLoadingUrl(opts: CreateURLOptions, platform: string) {
    const url = new URL('_expo/loading', this.constructUrl({ scheme: 'http', ...opts }));
    url.search = new URLSearchParams({ platform }).toString();
    return url.toString();
  }

  public constructDevClientUrl(opts?: CreateURLOptions): null | string {
    const protocol: string = opts?.scheme || this.defaults.scheme;
    if (!protocol) {
      return null;
    }

    const manifestUrl = this.constructUrl({ ...opts, scheme: 'http' });
    return `${protocol}://expo-development-client/?url=${encodeURIComponent(manifestUrl)}`;
  }

  public constructUrl(opts?: Partial<CreateURLOptions> | null): string {
    const urlComponents = this.getUrlComponents({
      ...this.defaults,
      ...opts,
    });
    return joinUrlComponents(urlComponents);
  }

  private getTunnelUrlComponents(opts: Pick<CreateURLOptions, 'scheme'>) {
    const tunnelUrl = this.bundlerInfo.getTunnelUrl();
    if (!tunnelUrl) {
      return null;
    }
    const parsed = new URL(tunnelUrl);
    return {
      port: parsed.port,
      hostname: parsed.hostname,
      protocol: opts.scheme ?? 'http',
    };
  }

  private getUrlComponents(opts: CreateURLOptions): {
    port: string;
    hostname: string;
    protocol: string;
  } {
    // Proxy comes first.
    const proxyURL = getProxyUrl();
    if (proxyURL) {
      return getUrlComponentsFromProxyUrl(opts, proxyURL);
    }

    // Ngrok.
    if (opts.hostType === 'tunnel') {
      const components = this.getTunnelUrlComponents(opts);
      if (components) {
        return components;
      }
      Log.warn('Tunnel URL not found (it might not be ready yet), falling back to LAN URL.');
    } else if (opts.hostType === 'localhost' && !opts.hostname) {
      opts.hostname = 'localhost';
    }

    return {
      hostname: getDefaultHostname(opts),
      port: this.bundlerInfo.port.toString(),
      protocol: opts.scheme ?? 'http',
    };
  }
}

function getUrlComponentsFromProxyUrl(opts: Pick<CreateURLOptions, 'scheme'>, url: string) {
  const parsedProxyUrl = new URL(url);
  let protocol = opts.scheme || 'http';
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

function getDefaultHostname(opts: Pick<CreateURLOptions, 'hostname'>) {
  // TODO: Drop REACT_NATIVE_PACKAGER_HOSTNAME
  if (process.env.REACT_NATIVE_PACKAGER_HOSTNAME) {
    return process.env.REACT_NATIVE_PACKAGER_HOSTNAME.trim();
  } else if (opts.hostname === 'localhost') {
    // Restrict the use of `localhost`
    // TODO: Note why we do this.
    return '127.0.0.1';
  }

  return opts.hostname || getIpAddress();
}

function joinUrlComponents({
  protocol,
  hostname,
  port,
}: {
  /** Empty string or nullish means no protocol will be added. */
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

/** @deprecated */
function getProxyUrl(): string | undefined {
  return process.env.EXPO_PACKAGER_PROXY_URL;
}

// TODO: Drop the undocumented env variables:
// EXPO_PACKAGER_HOSTNAME
// REACT_NATIVE_PACKAGER_HOSTNAME
// EXPO_PACKAGER_PROXY_URL
// EXPO_MANIFEST_PROXY_URL
