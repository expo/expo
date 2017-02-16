/* @flow */

/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule FriendlyUrls
 */
'use strict';

import url from 'url';

let FriendlyUrls = {
  toFriendlyString(rawUrl, removeHomeHost = true) {
    if (!rawUrl) {
      return '';
    }

    let components = url.parse(rawUrl, false, true);
    if (components.hostname === 'exp.host') {
      if (components.pathname === '/~exponent/welcome') {
        return 'Welcome to Exponent';
      }
      components.slashes = false;
      components.protocol = null;
      components.pathname = components.pathname.substr(1);
      if (removeHomeHost) {
        components.host = null;
        components.hostname = null;
        return url.format(components);
      } else {
        // remove slashes but leave the host alone
        return url.format(components).substring(2);
      }
    }

    let commonProtocols = ['exp:', 'exps:', 'http:', 'https:'];
    if (commonProtocols.indexOf(components.protocol) !== -1) {
      // Remove the scheme and slashes
      return url.format(components).substr(components.protocol.length + 2);
    }
    return rawUrl;
  },
};

export default FriendlyUrls;
