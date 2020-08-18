const withCSS = require('@zeit/next-css');
const { copySync, removeSync } = require('fs-extra');
const { join } = require('path');
const semver = require('semver');

const { version } = require('./package.json');

// copy versions/v(latest version) to versions/latest
// (Next.js only half-handles symlinks)
const vLatest = join('pages', 'versions', `v${version}/`);
const latest = join('pages', 'versions', 'latest/');
removeSync(latest);
copySync(vLatest, latest);

module.exports = withCSS({
  // Rather than use `@zeit/next-mdx`, we replicate it
  pageExtensions: ['js', 'jsx', 'md', 'mdx'],
  webpack: (config, options) => {
    // Create a copy of the babel loader, to separate MDX and Next/Preval caches
    const babelMdxLoader = {
      ...options.defaultLoaders.babel,
      options: {
        ...options.defaultLoaders.babel.options,
        cacheDirectory: 'node_modules/.cache/babel-mdx-loader',
      },
    };
    config.module.rules.push({
      test: /.mdx?$/, // load both .md and .mdx files
      use: [babelMdxLoader, '@mdx-js/loader', join(__dirname, './common/md-loader')],
    });
    config.node = {
      fs: 'empty',
    };
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
          // hide versions greater than the package.json version number
          const versionMatch = pathname.match(/\/v(\d\d\.\d\.\d)\//);
          if (versionMatch && versionMatch[1] && semver.gt(versionMatch[1], version)) {
            return {};
          }
          return { [pathname]: page };
        }
      })
    );
  },
});
