const LATEST_VERSION = 'v' + require('./package.json').version;

module.exports = {
  async exportPathMap(defaultPathMap, {dev}) {
    if (dev) {
      return defaultPathMap
    }
    return Object.assign(
      ...Object.entries(defaultPathMap).map(([pathname, page]) => {
        if (pathname.match(/\/v[1-9][^\/]*$/)) {
          // ends in "/v<version>"
          pathname += '/index.html'; // TODO: find out why we need to do this
        }

        result = { [pathname]: page };

        // For every path which doesn't end in ".html" (except "/"), create a matching copy with ".html" added
        // (We have many internal links of this sort)
        if (! pathname.match(/\.html$/) && pathname.match(/[a-z]$/)) {
          result[pathname + ".html"] = page;
        }


        return result;
      })
    );
  },
};
