import { withSentryConfig } from '@sentry/nextjs';
import frontmatter from 'front-matter';
import type { NextConfig } from 'next';
import { event, error } from 'next/dist/build/output/log.js';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { exit } from 'node:process';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGFM from 'remark-gfm';
import remarkMDX from 'remark-mdx';
import remarkMdxDisableExplicitJsx from 'remark-mdx-disable-explicit-jsx';
import remarkMDXFrontmatter from 'remark-mdx-frontmatter';
import semver from 'semver';

import packageJson from '~/package.json';

import remarkCodeTitle from './mdx-plugins/remark-code-title.js';
import remarkCreateStaticProps from './mdx-plugins/remark-create-static-props.js';
import remarkExportHeadings from './mdx-plugins/remark-export-headings.js';
import remarkLinkRewrite from './mdx-plugins/remark-link-rewrite.js';
import remarkSDKCompatibility from './mdx-plugins/remark-sdk-compatibility.js';
import navigation from './public/static/constants/navigation.json';
import { VERSIONS } from './public/static/constants/versions.json';
import createSitemap from './scripts/create-sitemap.js';

const packageJsonObject: Record<string, unknown> = packageJson;
const betaVersion =
  typeof packageJsonObject.betaVersion === 'string' ? packageJsonObject.betaVersion : undefined;
const latestVersion =
  typeof packageJsonObject.version === 'string' ? packageJsonObject.version : undefined;
const newestVersion = betaVersion ?? latestVersion;

if (!newestVersion) {
  error('Cannot determine newest SDK version, aborting!');
  exit(1);
}

const removeConsoleConfig =
  process.env.NODE_ENV !== 'development'
    ? {
        exclude: ['error'],
      }
    : false;

const nextConfig: NextConfig = {
  outputFileTracingRoot: join(__dirname),
  transpilePackages: [
    '@expo/*',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-select',
    'framer-motion',
    'prismjs',
  ],
  trailingSlash: true,
  devIndicators: {
    position: 'bottom-right',
  },
  experimental: {
    optimizePackageImports: ['@expo/*', '@radix-ui/*', 'cmdk', 'framer-motion', 'prismjs'],
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
    esmExternals: true,
    webpackBuildWorker: true,
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
  webpack: (config, { defaultLoaders, isServer }) => {
    // Remove unnecessary built-in polyfills that Next.js injects unconditionally.
    // All polyfilled APIs (Array.prototype.at, Object.hasOwn, etc.) are natively
    // supported by our browserslist targets (Chrome 93+, Firefox 92+, Safari 15.4+).
    if (!isServer) {
      config.plugins.push(
        new (require('webpack').NormalModuleReplacementPlugin)(
          /[/\\]polyfill-module\.js$/,
          join(__dirname, 'empty-polyfill.js')
        )
      );
    }

    // Add support for MDX with our custom loader
    config.module.rules.push({
      test: /\.mdx?$/,
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
              remarkSDKCompatibility,
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
          if (versionMatch?.[1] && semver.gt(versionMatch[1], newestVersion, false)) {
            return undefined;
          }
        }

        return { [pathname]: page };
      })
    );

    // Build a map of URL paths to ISO date strings from MDX frontmatter
    const modificationDates: Record<string, string> = {};
    const pagesDir = join(__dirname, 'pages');
    for (const urlPath of Object.keys(pathMap)) {
      const mdxPath =
        [join(pagesDir, `${urlPath}.mdx`), join(pagesDir, urlPath, 'index.mdx')].find(existsSync) ??
        null;
      if (mdxPath) {
        try {
          const { attributes } = frontmatter<{ modificationDate?: string }>(
            readFileSync(mdxPath, 'utf-8')
          );
          if (attributes.modificationDate) {
            // Strip ordinal suffixes (e.g., "17th" -> "17") before parsing
            const cleaned = attributes.modificationDate.replace(/(\d+)(st|nd|rd|th)/, '$1');
            const parsed = new Date(cleaned);
            if (!isNaN(parsed.getTime())) {
              // Use local date parts to avoid timezone shift (Date parses as local midnight)
              const y = parsed.getFullYear();
              const m = String(parsed.getMonth() + 1).padStart(2, '0');
              const d = String(parsed.getDate()).padStart(2, '0');
              modificationDates[urlPath] = `${y}-${m}-${d}`;
            }
          }
        } catch (catchError) {
          error(`Failed to read lastmod date from ${mdxPath}: ${catchError}`);
        }
      }
    }

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
      pathsHidden: [...navigation.previewDirectories, ...navigation.archiveDirectories, 'internal'],
      modificationDates,
    });
    event(`Generated sitemap with ${sitemapEntries.length} entries`);

    return pathMap;
  },
};

const nextConfigWithSentry = withSentryConfig(nextConfig, {
  org: 'expoio',
  project: 'docs',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  telemetry: false,
  debug: false, // Set to `true` to enable debug logging if having issues with missing source maps
  widenClientFileUpload: true, // Upload a larger set of source maps for prettier stack traces (increases build time)
  sourcemaps: {
    disable: false, // Set `true` to kill sourcemaps upload
    assets: ['out/**/*.js', 'out/**/*.js.map', '.next/**/*.js', '.next/**/*.js.map'], // Specify which files to upload
    ignore: ['**/node_modules/**'], // Files to exclude
    deleteSourcemapsAfterUpload: true, // Delete source maps after upload to avoid publicly exposing them
  },
});

export default nextConfigWithSentry;
