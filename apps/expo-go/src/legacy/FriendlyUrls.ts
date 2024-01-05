import url from 'url';

import Config from '../api/Config';

const FriendlyUrls = {
  toFriendlyString(rawUrl: string, removeHomeHost: boolean = true) {
    if (!rawUrl) {
      return '';
    }

    const components = url.parse(rawUrl, false, true);
    if (components.hostname === Config.api.host) {
      components.slashes = false;
      components.protocol = '';
      components.pathname = components.pathname ? components.pathname.substr(1) : '';
      if (removeHomeHost) {
        components.host = '';
        components.hostname = '';
        return url.format(components);
      } else {
        // remove slashes but leave the host alone
        return url.format(components).substring(2);
      }
    }

    const protocol = components.protocol ? components.protocol : '';
    const commonProtocols = ['exp:', 'exps:', 'http:', 'https:'];
    if (components.protocol && commonProtocols.includes(components.protocol)) {
      // Remove the scheme and slashes
      return url.format(components).substr(protocol.length + 2);
    }
    return rawUrl;
  },
};

export default FriendlyUrls;
