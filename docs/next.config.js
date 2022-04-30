/* eslint-disable import/order */
const { copySync, removeSync } = require('fs-extra');
const { join } = require('path');
const semver = require('semver');
const { info: logInfo } = require('next/dist/build/output/log');

const navigation = require('./constants/navigation');
const { VERSIONS } = require('./constants/versions');
const { version, betaVersion } = require('./package.json');

// To generate a sitemap, we need context about the supported versions and navigational data
const createSitemap = require('./scripts/create-sitemap');

// Prepare the latest version by copying the actual exact latest version
const vLatest = join('pages', 'versions', `v${version}/`);
const latest = join('pages', 'versions', 'latest/');
removeSync(latest);
copySync(vLatest, latest);
logInfo(`Copied latest Expo SDK version from v${version}`);

/** @type {import('next').NextConfig}  */
module.exports = {
  trailingSlash: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  experimental: { emotion: true },
  swcMinify: true,
  // Next 11 does not support ESLint v8, enable it when we upgrade to 12
  eslint: { ignoreDuringBuilds: true },
  webpack: (config, options) => {
    // Add preval support for `constants/*` only and move it to the `.next/preval` cache.
    // It's to prevent over-usage and separate the cache to allow manually invalidation.
    // See: https://github.com/kentcdodds/babel-plugin-preval/issues/19
    config.module.rules.push({
      test: /.js$/,
      include: [join(__dirname, 'constants')],
      use: {
        loader: 'babel-loader',
        options: {
          // Keep this path in sync with package.json and other scripts that clear the cache
          cacheDirectory: '.next/preval',
          plugins: ['preval'],
          presets: ['next/babel'],
        },
      },
    });

    // Add support for MDX with our custom loader and esbuild
    config.module.rules.push({
      test: /.mdx?$/,
      use: [
        options.defaultLoaders.babel,
        {
          loader: '@mdx-js/loader',
          options: {
            remarkPlugins: [
              [require('remark-frontmatter'), ['yaml']],
              require('./mdx-plugins/remark-export-yaml'),
              require('./mdx-plugins/remark-export-headings'),
              require('./mdx-plugins/remark-link-rewrite'),
            ],
            rehypePlugins: [require('rehype-slug')],
          },
        },
      ],
    });

    // Fix inline or browser MDX usage: https://mdxjs.com/getting-started/webpack#running-mdx-in-the-browser
    config.resolve.fallback = { fs: false };

    return config;
  },
  // Create a map of all pages to export
  async exportPathMap(defaultPathMap, { dev, outDir }) {
    if (dev) {
      return defaultPathMap;
    }
    const pathMap = Object.assign(
      ...Object.entries(defaultPathMap).map(([pathname, page]) => {
        if (pathname.match(/unversioned/)) {
          // Remove unversioned pages from the exported site
          return {};
        } else {
          // Remove newer unreleased versions from the exported side
          const versionMatch = pathname.match(/\/v(\d\d\.\d\.\d)\//);
          if (versionMatch?.[1] && semver.gt(versionMatch[1], betaVersion || version)) {
            return {};
          }
        }

        return { [pathname]: page };
      })
    );

    const sitemapEntries = createSitemap({
      pathMap,
      domain: `https://docs.expo.dev`,
      output: join(outDir, `sitemap.xml`),
      // Some of the search engines only track the first N items from the sitemap,
      // this makes sure our starting and general guides are first, and API index last (in order from new to old)
      pathsPriority: [
        ...navigation.startingDirectories,
        ...navigation.generalDirectories,
        ...navigation.easDirectories,
        ...VERSIONS.map(version => `versions/${version}`),
      ],
      // Some of our pages are "hidden" and should not be added to the sitemap
      pathsHidden: navigation.previewDirectories,
    });
    logInfo(`📝 Generated sitemap with ${sitemapEntries.length} entries`);

    return pathMap;
  },
  async headers() {
    const cacheHeaders = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];
    return [{ source: '/_next/static/:static*', headers: cacheHeaders }];
  },
};
