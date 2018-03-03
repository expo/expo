import url from 'url';

let FriendlyUrls = {
  toFriendlyString(rawUrl: string, removeHomeHost: boolean = true) {
    if (!rawUrl) {
      return '';
    }

    let components = url.parse(rawUrl, false, true);
    if (components.hostname === 'exp.host') {
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

    let protocol = components.protocol ? components.protocol : '';
    let commonProtocols = ['exp:', 'exps:', 'http:', 'https:'];
    if (commonProtocols.indexOf(components.protocol) !== -1) {
      // Remove the scheme and slashes
      return url.format(components).substr(protocol.length + 2);
    }
    return rawUrl;
  },
};

export default FriendlyUrls;
