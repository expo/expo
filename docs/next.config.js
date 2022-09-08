import fsExtra from 'fs-extra';
import { info as logInfo } from 'next/dist/build/output/log.js';
import { join } from 'path';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import semver from 'semver';
import { fileURLToPath } from 'url';

import * as navigation from './constants/navigation.cjs';
import { VERSIONS } from './constants/versions.cjs';
import remarkExportHeadings from './mdx-plugins/remark-export-headings.cjs';
import remarkExportYaml from './mdx-plugins/remark-export-yaml.cjs';
import remarkLinkRewrite from './mdx-plugins/remark-link-rewrite.cjs';
import createSitemap from './scripts/create-sitemap.cjs';

const { copySync, removeSync, readJsonSync } = fsExtra;

// note(simek): We cannot use direct JSON import because ESLint do not support `assert { type: 'json' }` syntax yet:
// * https://github.com/eslint/eslint/discussions/15305
const { version, betaVersion } = readJsonSync('./package.json');
const dirname = fileURLToPath(new URL('.', import.meta.url));

// Prepare the latest version by copying the actual exact latest version
const vLatest = join('pages', 'versions', `v${version}/`);
const latest = join('pages', 'versions', 'latest/');
removeSync(latest);
copySync(vLatest, latest);
logInfo(`Copied latest Expo SDK version from v${version}`);

/** @type {import('next').NextConfig}  */
export default {
  trailingSlash: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  compiler: { emotion: true },
  swcMinify: true,
  webpack: (config, options) => {
    // Add preval support for `constants/*` only and move it to the `.next/preval` cache.
    // It's to prevent over-usage and separate the cache to allow manually invalidation.
    // See: https://github.com/kentcdodds/babel-plugin-preval/issues/19
    config.module.rules.push({
      test: /.js$/,
      include: [join(dirname, 'constants')],
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

    // Add support for MDX with our custom loader
    config.module.rules.push({
      test: /.mdx?$/,
      use: [
        options.defaultLoaders.babel,
        {
          loader: '@mdx-js/loader',
          options: {
            remarkPlugins: [
              [remarkFrontmatter, ['yaml']],
              remarkExportYaml,
              remarkExportHeadings,
              remarkLinkRewrite,
            ],
            rehypePlugins: [rehypeSlug],
          },
        },
      ],
    });

    // Fix inline or browser MDX usage
    config.resolve.fallback = { fs: false, path: 'path-browserify' };

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
