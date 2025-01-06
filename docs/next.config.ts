import type { NextConfig } from 'next';
import { event, error } from 'next/dist/build/output/log.js';
import { join } from 'node:path';
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
import navigation from './public/static/constants/navigation.json';
import { VERSIONS } from './public/static/constants/versions.json';
import createSitemap from './scripts/create-sitemap.js';

import packageJson from '~/package.json';

const betaVersion =
  'betaVersion' in packageJson ? (packageJson?.betaVersion as string) : packageJson.version;

const removeConsoleConfig =
  process.env.NODE_ENV !== 'development'
    ? {
        exclude: ['error'],
      }
    : false;

const nextConfig: NextConfig = {
  transpilePackages: [
    '@expo/*',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-select',
    'framer-motion',
    'prismjs',
  ],
  trailingSlash: true,
  experimental: {
    optimizePackageImports: ['@expo/*', '@radix-ui/*', 'cmdk', 'framer-motion', 'prismjs'],
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
    esmExternals: true,
    webpackBuildWorker: true,
    // staticGenerationRetryCount: 1,
    // staticGenerationMaxConcurrency: 4,
    // staticGenerationMinPagesPerWorker: 50,
    // note(simek): would be nice enhancement, but it breaks the `@next/font` styles currently,
    // and results in font face swap on every page reload
    optimizeCss: false,
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  compiler: {
    reactRemoveProperties: true,
    removeConsole: removeConsoleConfig,
  },
  output: 'export',
  poweredByHeader: false,
  webpack: (config, { defaultLoaders }) => {
    // Add support for MDX with our custom loader
    config.module.rules.push({
      test: /.mdx?$/,
      use: [
        defaultLoaders.babel,
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

    config.output.environment = { ...config.output.environment, asyncFunction: true };
    config.experiments = { ...config.experiments, topLevelAwait: true };

    return config;
  },

  // Create a map of all pages to export
  // https://nextjs.org/docs/pages/api-reference/config/next-config-js/exportPathMap
  async exportPathMap(defaultPathMap, { dev, outDir }) {
    if (dev) {
      return defaultPathMap;
    }

    if (!outDir) {
      error('Output directory is not defined! Falling back to the default export map.');
      return defaultPathMap;
    }

    const pathMap = Object.assign(
      {},
      ...Object.entries(defaultPathMap).map(([pathname, page]) => {
        if (pathname.includes('unversioned')) {
          // Remove unversioned pages from the exported site
          return undefined;
        } else {
          // Remove newer unreleased versions from the exported side
          const versionMatch = pathname.match(/\/v(\d\d\.\d\.\d)\//);
          if (versionMatch?.[1] && semver.gt(versionMatch[1], betaVersion, false)) {
            return undefined;
          }
        }

        return { [page.page]: page };
      })
    );

    const sitemapEntries = createSitemap({
      pathMap,
      domain: `https://docs.expo.dev`,
      output: join(outDir, `sitemap.xml`),
      // Some of the search engines only track the first N items from the sitemap,
      // this makes sure our starting and general guides are first, and API index last (in order from new to old)
      pathsPriority: [
        ...navigation.homeDirectories,
        ...navigation.easDirectories,
        ...navigation.learnDirectories,
        ...navigation.generalDirectories,
        ...navigation.referenceDirectories.filter(dir => dir === 'versions'),
        ...VERSIONS.map(version => `versions/${version}`),
      ],
      // Some of our pages are "hidden" and should not be added to the sitemap
      pathsHidden: [...navigation.previewDirectories, ...navigation.archiveDirectories],
    });
    event(`Generated sitemap with ${sitemapEntries.length} entries`);

    return pathMap;
  },
};

export default nextConfig;
