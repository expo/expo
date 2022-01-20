import { getConfig } from '@expo/config';
import assert from 'assert';
import Joi from 'joi';
import os from 'os';
import QueryString from 'querystring';
import url from 'url';

import * as Log from '../log';
import { CommandError } from '../utils/errors';
import { getIpAddressAsync } from '../utils/ip';
import ProcessSettings from './api/ProcessSettings';
import * as ProjectSettings from './api/ProjectSettings';

interface URLOptions extends Omit<ProjectSettings.ProjectSettings, 'urlRandomness'> {
  urlType: null | 'exp' | 'http' | 'no-protocol' | 'redirect' | 'custom';
}

interface MetroQueryOptions {
  dev?: boolean;
  strict?: boolean;
  minify?: boolean;
}

export async function constructBundleUrlAsync(
  projectRoot: string,
  opts: Partial<URLOptions>,
  requestHostname?: string
) {
  return await constructUrlAsync(projectRoot, opts, true, requestHostname);
}

export async function constructDeepLinkAsync(
  projectRoot: string,
  opts?: Partial<URLOptions>,
  requestHostname?: string
): Promise<string> {
  const { devClient } = await ProjectSettings.readAsync(projectRoot);
  if (devClient) {
    return constructDevClientUrlAsync(projectRoot, opts, requestHostname);
  } else {
    return constructManifestUrlAsync(projectRoot, opts, requestHostname);
  }
}

export async function constructManifestUrlAsync(
  projectRoot: string,
  opts?: Partial<URLOptions>,
  requestHostname?: string
) {
  return await constructUrlAsync(projectRoot, opts ?? null, false, requestHostname);
}

export async function constructDevClientUrlAsync(
  projectRoot: string,
  opts?: Partial<URLOptions>,
  requestHostname?: string
) {
  let _scheme: string;
  if (opts?.scheme) {
    _scheme = opts?.scheme;
  } else {
    const { scheme } = await ProjectSettings.readAsync(projectRoot);
    if (!scheme || typeof scheme !== 'string') {
      throw new CommandError('NO_DEV_CLIENT_SCHEME', 'No scheme specified for development client');
    }
    _scheme = scheme;
  }
  const protocol = resolveProtocol(projectRoot, { scheme: _scheme, urlType: 'custom' });
  const manifestUrl = await constructManifestUrlAsync(
    projectRoot,
    { ...opts, urlType: 'http' },
    requestHostname
  );
  return `${protocol}://expo-development-client/?url=${encodeURIComponent(manifestUrl)}`;
}

// gets the base manifest URL and removes the scheme
export async function constructHostUriAsync(
  projectRoot: string,
  requestHostname?: string
): Promise<string> {
  const urlString = await constructUrlAsync(projectRoot, null, false, requestHostname);
  // we need to use node's legacy urlObject api since the newer one doesn't like empty protocols
  const urlObj = url.parse(urlString);
  urlObj.protocol = '';
  urlObj.slashes = false;
  return url.format(urlObj);
}

export async function constructLogUrlAsync(
  projectRoot: string,
  requestHostname?: string
): Promise<string> {
  const baseUrl = await constructUrlAsync(projectRoot, { urlType: 'http' }, false, requestHostname);
  return `${baseUrl}/logs`;
}

export async function constructLoadingUrlAsync(
  projectRoot: string,
  platform: 'ios' | 'android',
  requestHostname?: string
): Promise<string> {
  const baseUrl = await constructUrlAsync(projectRoot, { urlType: 'http' }, false, requestHostname);
  return `${baseUrl}/_expo/loading?platform=${platform}`;
}

export async function constructUrlWithExtensionAsync(
  projectRoot: string,
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
  let bundleUrl = await constructBundleUrlAsync(
    projectRoot,
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

export async function constructPublishUrlAsync(
  projectRoot: string,
  entryPoint: string,
  requestHostname?: string,
  metroQueryOptions?: MetroQueryOptions
): Promise<string> {
  return await constructUrlWithExtensionAsync(
    projectRoot,
    entryPoint,
    'bundle',
    requestHostname,
    metroQueryOptions
  );
}

export async function constructSourceMapUrlAsync(
  projectRoot: string,
  entryPoint: string,
  requestHostname?: string
): Promise<string> {
  return await constructUrlWithExtensionAsync(projectRoot, entryPoint, 'map', requestHostname);
}

export async function constructAssetsUrlAsync(
  projectRoot: string,
  entryPoint: string,
  requestHostname?: string
): Promise<string> {
  return await constructUrlWithExtensionAsync(projectRoot, entryPoint, 'assets', requestHostname);
}

export async function constructDebuggerHostAsync(
  projectRoot: string,
  requestHostname?: string
): Promise<string> {
  return await constructUrlAsync(
    projectRoot,
    {
      urlType: 'no-protocol',
    },
    true,
    requestHostname
  );
}

export function constructBundleQueryParams(opts: MetroQueryOptions): string {
  const queryParams: Record<string, boolean | string> = {
    dev: !!opts.dev,
    hot: false,
  };

  if ('strict' in opts) {
    queryParams.strict = !!opts.strict;
  }

  if ('minify' in opts) {
    // TODO: Maybe default this to true if dev is false
    queryParams.minify = !!opts.minify;
  }

  return QueryString.stringify(queryParams);
}

export async function constructWebAppUrlAsync(
  projectRoot: string,
  options: { hostType?: 'localhost' | 'lan' | 'tunnel' } = {}
): Promise<string | null> {
  const packagerInfo = await ProjectSettings.readPackagerInfoAsync(projectRoot);
  if (!packagerInfo.webpackServerPort) {
    return null;
  }

  const { https, hostType } = await ProjectSettings.readAsync(projectRoot);
  const host = (options.hostType ?? hostType) === 'localhost' ? 'localhost' : getIpAddressAsync();

  let urlType = 'http';
  if (https === true) {
    urlType = 'https';
  }

  return `${urlType}://${host}:${packagerInfo.webpackServerPort}`;
}

function assertValidOptions(opts: Partial<URLOptions>): URLOptions {
  const schema = Joi.object().keys({
    devClient: Joi.boolean().optional(),
    scheme: Joi.string().optional().allow(null),
    // Replaced by `scheme`
    urlType: Joi.any().valid('exp', 'http', 'redirect', 'no-protocol').allow(null),
    lanType: Joi.any().valid('ip', 'hostname'),
    hostType: Joi.any().valid('localhost', 'lan', 'tunnel'),
    dev: Joi.boolean(),
    strict: Joi.boolean(),
    minify: Joi.boolean(),
    https: Joi.boolean().optional(),
    urlRandomness: Joi.string().optional().allow(null),
  });

  const { error } = schema.validate(opts);
  if (error) {
    throw new CommandError('INVALID_OPTIONS', error.toString());
  }

  return opts as URLOptions;
}

async function ensureOptionsAsync(
  projectRoot: string,
  opts: Partial<URLOptions> | null
): Promise<URLOptions> {
  if (opts) {
    assertValidOptions(opts);
  }

  const defaultOpts = await ProjectSettings.readAsync(projectRoot);
  if (!opts) {
    return { urlType: null, ...defaultOpts };
  }
  const optionsWithDefaults = { ...defaultOpts, ...opts };
  return assertValidOptions(optionsWithDefaults);
}

function resolveProtocol(
  projectRoot: string,
  { urlType, ...options }: Pick<URLOptions, 'urlType' | 'scheme'>
): string | null {
  if (urlType === 'http') {
    return 'http';
  } else if (urlType === 'no-protocol') {
    return null;
  } else if (urlType === 'custom') {
    return options.scheme;
  }
  let protocol = 'exp';

  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });

  // We only use these values from the config
  const { scheme, detach } = exp;

  if (detach) {
    // Normalize schemes and filter invalid schemes.
    const schemes = (Array.isArray(scheme) ? scheme : [scheme]).filter(
      (scheme: any) => typeof scheme === 'string' && !!scheme
    );
    // Get the first valid scheme.
    const firstScheme = schemes[0];
    if (firstScheme) {
      protocol = firstScheme;
    } else if (detach.scheme) {
      // must keep this fallback in place for older projects
      // and those detached with an older version of xdl
      protocol = detach.scheme;
    }
  }

  return protocol;
}

export async function constructUrlAsync(
  projectRoot: string,
  incomingOpts: Partial<URLOptions> | null,
  isPackager: boolean,
  requestHostname?: string
): Promise<string> {
  const opts = await ensureOptionsAsync(projectRoot, incomingOpts);

  const packagerInfo = await ProjectSettings.readPackagerInfoAsync(projectRoot);

  let protocol = resolveProtocol(projectRoot, opts);

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
    port = packagerInfo.packagerPort;
  } else if (opts.hostType === 'lan' || ProcessSettings.isOffline) {
    if (process.env.EXPO_PACKAGER_HOSTNAME) {
      hostname = process.env.EXPO_PACKAGER_HOSTNAME.trim();
    } else if (process.env.REACT_NATIVE_PACKAGER_HOSTNAME) {
      hostname = process.env.REACT_NATIVE_PACKAGER_HOSTNAME.trim();
    } else if (opts.lanType === 'ip') {
      if (requestHostname) {
        hostname = requestHostname;
      } else {
        hostname = getIpAddressAsync();
      }
    } else {
      // Some old versions of OSX work with hostname but not local ip address.
      hostname = os.hostname();
    }
    port = packagerInfo.packagerPort;
  } else {
    const ngrokUrl = packagerInfo.packagerNgrokUrl;
    if (!ngrokUrl || typeof ngrokUrl !== 'string') {
      // TODO: if you start with --tunnel flag then this warning will always
      // show up right before the tunnel starts...
      Log.warn('Tunnel URL not found (it might not be ready yet), falling back to LAN URL.');

      return constructUrlAsync(
        projectRoot,
        { ...opts, hostType: 'lan' },
        isPackager,
        requestHostname
      );
    } else {
      //   ProjectUtils.clearNotification(projectRoot, 'tunnel-url-not-found');
      const pnu = url.parse(ngrokUrl);
      hostname = pnu.hostname;
      port = pnu.port;
    }
  }

  const url_ = joinURLComponents({ protocol, hostname, port });

  if (opts.urlType === 'redirect') {
    return createRedirectURL(url_);
  }

  return url_;
}

function createRedirectURL(url: string): string {
  return `https://exp.host/--/to-exp/${encodeURIComponent(url)}`;
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

export function isHttps(urlString: string): boolean {
  return isURL(urlString, { protocols: ['https'] });
}

export function isURL(
  urlString: string,
  { protocols, requireProtocol }: { protocols?: string[]; requireProtocol?: boolean }
) {
  try {
    // eslint-disable-next-line
    new url.URL(urlString);
    const parsed = url.parse(urlString);
    if (!parsed.protocol && !requireProtocol) {
      return true;
    }
    return protocols
      ? parsed.protocol
        ? protocols.map((x) => `${x.toLowerCase()}:`).includes(parsed.protocol)
        : false
      : true;
  } catch (err) {
    return false;
  }
}
