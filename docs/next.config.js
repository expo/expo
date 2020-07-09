const { join } = require('path');
const { copySync, removeSync } = require('fs-extra');
const withCSS = require('@zeit/next-css');

// copy versions/v(latest version) to versions/latest
// (Next.js only half-handles symlinks)
const vLatest = join('pages', 'versions', `v${require('./package.json').version}/`);
const latest = join('pages', 'versions', 'latest/');
removeSync(latest);
copySync(vLatest, latest);

module.exports = withCSS({
  // Rather than use `@zeit/next-mdx`, we replicate it
  pageExtensions: ['js', 'jsx', 'md', 'mdx'],
  webpack: (config, options) => {
    config.module.rules.push({
      test: /.mdx?$/, // load both .md and .mdx files
      use: [options.defaultLoaders.babel, '@mdx-js/loader', join(__dirname, './common/md-loader')],
    });
    return config;
  },
  async exportPathMap(defaultPathMap, { dev, dir, outDir }) {
    if (dev) {
      return defaultPathMap;
    }
    copySync(join(dir, 'robots.txt'), join(outDir, 'robots.txt'));
    return Object.assign(
      ...Object.entries(defaultPathMap).map(([pathname, page]) => {
        if (pathname.match(/\/v[1-9][^\/]*$/)) {
          // ends in "/v<version>"
          pathname += '/index.html'; // TODO: find out why we need to do this
        }
        if (pathname.match(/unversioned/)) {
          return {};
        } else {
          return { [pathname]: page };
        }
      })
    );
  },
});
