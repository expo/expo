const withCSS = require('@zeit/next-css');
const { copySync, removeSync } = require('fs-extra');
const { join } = require('path');
const semver = require('semver');

const { version } = require('./package.json');

// To generate a sitemap, we need context about the supported versions and navigational data
const createSitemap = require('./scripts/create-sitemap');
const navigation = require('./common/navigation-data');
const versions = require('./common/versions');

// copy versions/v(latest version) to versions/latest
// (Next.js only half-handles symlinks)
const vLatest = join('pages', 'versions', `v${version}/`);
const latest = join('pages', 'versions', 'latest/');
removeSync(latest);
copySync(vLatest, latest);

module.exports = withCSS({
  trailingSlash: true,
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
  // Create a map of all pages to export
  async exportPathMap(defaultPathMap, { dev, outDir }) {
    if (dev) {
      return defaultPathMap;
    }
    const pathMap = Object.assign(
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
    // Create a sitemap for crawlers like Google and Algolia
    createSitemap({
      pathMap,
      domain: 'https://docs.expo.io',
      output: join(outDir, 'sitemap.xml'),
      // Some of the search engines only track the first N items from the sitemap,
      // this makes sure our starting and general guides are first, and API index last (in order from new to old)
      pathsPriority: [
        ...navigation.startingDirectories,
        ...navigation.generalDirectories,
        ...versions.VERSIONS.map(version => `versions/${version}`),
      ],
      // Some of our pages are "hidden" and should not be added to the sitemap
      pathsHidden: navigation.previewDirectories,
    });

    return pathMap;
  },
});
