import fsExtra from 'fs-extra';
import { info as logInfo } from 'next/dist/build/output/log.js';
import { join } from 'path';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGFM from 'remark-gfm';
import remarkMDX from 'remark-mdx';
import remarkMdxDisableExplicitJsx from 'remark-mdx-disable-explicit-jsx';
import remarkMDXFrontmatter from 'remark-mdx-frontmatter';
import semver from 'semver';

import remarkCodeTitle from './mdx-plugins/remark-code-title.js';
import remarkCreateStaticProps from './mdx-plugins/remark-create-static-props.js';
import remarkExportHeadings from './mdx-plugins/remark-export-headings.js';
import remarkLinkRewrite from './mdx-plugins/remark-link-rewrite.js';
import createSitemap from './scripts/create-sitemap.js';

const { copySync, removeSync, readJsonSync } = fsExtra;

// note(simek): We cannot use direct JSON import because ESLint do not support `assert { type: 'json' }` syntax yet:
// * https://github.com/eslint/eslint/discussions/15305
const { version, betaVersion } = readJsonSync('./package.json');
const { VERSIONS } = readJsonSync('./public/static/constants/versions.json');
const navigation = readJsonSync('./public/static/constants/navigation.json');

// Prepare the latest version by copying the actual exact latest version
const vLatest = join('pages', 'versions', `v${version}/`);
const latest = join('pages', 'versions', 'latest/');
removeSync(latest);
copySync(vLatest, latest);
logInfo(`Copied latest Expo SDK version from v${version}`);

/** @type {import('next').NextConfig}  */
export default {
  trailingSlash: true,
  experimental: {
    esmExternals: true,
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  compiler: {
    emotion: true,
    reactRemoveProperties: true,
    removeConsole: {
      exclude: ['error'],
    },
  },
  swcMinify: true,
  poweredByHeader: false,
  webpack: (config, options) => {
    // Add support for MDX with our custom loader
    config.module.rules.push({
      test: /.mdx?$/,
      use: [
        options.defaultLoaders.babel,
        {
          loader: '@mdx-js/loader',
          /** @type {import('@mdx-js/loader').Options} */
          options: {
            providerImportSource: '@mdx-js/react',
            remarkPlugins: [
              remarkMDX,
              remarkGFM,
              [remarkMdxDisableExplicitJsx, { whiteList: ['kbd'] }],
              remarkFrontmatter,
              [remarkMDXFrontmatter, { name: 'meta' }],
              remarkCodeTitle,
              remarkExportHeadings,
              remarkLinkRewrite,
              [remarkCreateStaticProps, `{ meta: meta || {}, headings: headings || [] }`],
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
  // https://nextjs.org/docs/api-reference/next.config.js/exportPathMap
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
          if (versionMatch?.[1] && semver.gt(versionMatch[1], betaVersion || version, false)) {
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
      pathsHidden: [...navigation.previewDirectories, ...navigation.archiveDirectories],
    });
    logInfo(`📝 Generated sitemap with ${sitemapEntries.length} entries`);

    return pathMap;
  },
  async headers() {
    const cacheHeaders = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];
    return [{ source: '/_next/static/:static*', headers: cacheHeaders }];
  },
};
