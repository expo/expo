// Copyright 2015-present 650 Industries. All rights reserved.

import { getBundleUrl } from './getBundleUrl';
export { getBundleUrl } from './getBundleUrl';

/**
 * Origin the running bundle was served from, or `null` when it wasn't served over HTTP.
 *
 * This is the address the runtime actually reached, so it stays correct when a development server is
 * reached through an address it can't observe itself, such as a proxy or a tunnel. It's the value to
 * build other development server requests from, in place of an address the server reports for itself.
 *
 * A bundle loaded from disk has a `file:` URL, which is no address to resolve anything against.
 */
export function getBundleOrigin(bundleUrl = getBundleUrl()): string | null {
  if (!bundleUrl) {
    return null;
  }
  try {
    const { protocol, origin } = new URL(bundleUrl);
    // e.g. http://localhost:8081
    return protocol === 'http:' || protocol === 'https:' ? origin : null;
  } catch {
    return null;
  }
}
