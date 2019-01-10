const { join } = require('path');
const { copyFileSync } = require('fs-extra');

module.exports = {
  async exportPathMap(defaultPathMap, {dev, dir, outDir}) {
    if (dev) {
      return defaultPathMap
    }
    copyFileSync(join(dir, 'robots.txt'), join(outDir, 'robots.txt'))
    return Object.assign(
      ...Object.entries(defaultPathMap).map(([pathname, page]) => {
        if (pathname.match(/\/v[1-9][^\/]*$/)) {
          // ends in "/v<version>"
          pathname += '/index.html'; // TODO: find out why we need to do this
        }

        result = { [pathname]: page };

        return result;
      })
    );
  },
};
