/* eslint-disable import/order */
const { copySync, removeSync } = require('fs-extra');
const merge = require('lodash/merge');
const { join } = require('path');
const semver = require('semver');
const { ESBuildMinifyPlugin } = require('esbuild-loader');

const navigation = require('./constants/navigation-data');
const versions = require('./constants/versions');
const { version, betaVersion } = require('./package.json');

// To generate a sitemap, we need context about the supported versions and navigational data
const createSitemap = require('./scripts/create-sitemap');

// copy versions/v(latest version) to versions/latest
// (Next.js only half-handles symlinks)
const vLatest = join('pages', 'versions', `v${version}/`);
const latest = join('pages', 'versions', 'latest/');
removeSync(latest);
copySync(vLatest, latest);

// Determine if we are using esbuild for MDX transpiling
const enableEsbuild = !!process.env.USE_ESBUILD;

console.log(enableEsbuild ? 'Using esbuild for MDX files' : 'Using babel for MDX files');

module.exports = {
  // future: {
  //   webpack5: true,
  // },
  trailingSlash: true,
  // Rather than use `@zeit/next-mdx`, we replicate it
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  webpack: (config, options) => {
    // Add preval support for `constants/*` only and move it to the `.next/preval` cache.
    // It's to prevent over-usage and separate the cache to allow manually invalidation.
    // See: https://github.com/kentcdodds/babel-plugin-preval/issues/19
    config.module.rules.push({
      test: /.jsx?$/,
      include: [join(__dirname, 'constants')],
      use: merge({}, options.defaultLoaders.babel, {
        options: {
          // Keep this path in sync with package.json and other scripts that clear the cache
          cacheDirectory: '.next/preval',
          plugins: ['preval'],
        },
      }),
    });

    // Add support for MDX with our custom loader and esbuild
    config.module.rules.push({
      test: /.mdx?$/, // load both .md and .mdx files
      use: [
        !enableEsbuild
          ? options.defaultLoaders.babel
          : {
              loader: 'esbuild-loader',
              options: {
                loader: 'tsx',
                target: 'es2017',
              },
            },
        {
          loader: '@mdx-js/loader',
          options: {
            remarkPlugins: [
              [require('remark-frontmatter'), ['yaml']],
              require('./mdx-plugins/remark-export-yaml'),
              require('./mdx-plugins/remark-export-headings'),
              require('./mdx-plugins/remark-link-rewrite'),
            ],
          },
        },
      ],
    });

    // Fix inline or browser MDX usage: https://mdxjs.com/getting-started/webpack#running-mdx-in-the-browser
    // Webpack 4
    config.node = { fs: 'empty' };
    // Webpack 5
    // config.resolve.fallback = { fs: false, path: require.resolve('path-browserify') };

    // Add the esbuild plugin only when using esbuild
    if (enableEsbuild) {
      config.optimization.minimizer = [
        new ESBuildMinifyPlugin({
          target: 'es2017',
        }),
      ];
    }

    return config;
  },
  // Create a map of all pages to export
  async exportPathMap(defaultPathMap, { dev, outDir }) {
    if (dev) {
      return defaultPathMap;
    }
    const pathMap = Object.assign(
      ...Object.entries(defaultPathMap).map(([pathname, page]) => {
        if (pathname.match(/\/v[1-9][^/]*$/)) {
          // ends in "/v<version>"
          pathname += '/index.html'; // TODO: find out why we need to do this
        }
        if (pathname.match(/unversioned/)) {
          return {};
        } else {
          // hide versions greater than the package.json version number
          const versionMatch = pathname.match(/\/v(\d\d\.\d\.\d)\//);
          if (
            versionMatch &&
            versionMatch[1] &&
            semver.gt(versionMatch[1], betaVersion || version)
          ) {
            return {};
          }
          return { [pathname]: page };
        }
      })
    );

    createSitemap({
      pathMap,
      domain: `https://docs.expo.dev`,
      output: join(outDir, `sitemap.xml`),
      // Some of the search engines only track the first N items from the sitemap,
      // this makes sure our starting and general guides are first, and API index last (in order from new to old)
      pathsPriority: [
        ...navigation.startingDirectories,
        ...navigation.generalDirectories,
        ...navigation.easDirectories,
        ...versions.VERSIONS.map(version => `versions/${version}`),
      ],
      // Some of our pages are "hidden" and should not be added to the sitemap
      pathsHidden: navigation.previewDirectories,
    });

    return pathMap;
  },
  async headers() {
    const cacheHeaders = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];
    return [{ source: '/_next/static/:static*', headers: cacheHeaders }];
  },
};
