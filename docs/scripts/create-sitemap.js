import fs from 'node:fs';
import path from 'node:path';
import { SitemapStream } from 'sitemap';

const IGNORED_PAGES = new Set([
  '/404', // We don't want to add the 404 error page as sitemap entry
  '/versions', // Skip the redirect to latest, use `/versions/latest` instead
]);

const REDIRECT_STUB_MARKERS = new Map([
  ['.js', 'common/redirect'],
  ['.mdx', 'components/plugins/Redirect'],
]);

export function findRedirectStubUrls(pagesDirectory, urls) {
  const stubUrls = urls.filter(url => {
    const route = url.replace(/^\/+|\/+$/g, '');
    if (!route) {
      return false;
    }

    const candidates = [
      path.join(pagesDirectory, route, 'index.js'),
      path.join(pagesDirectory, route, 'index.mdx'),
      path.join(pagesDirectory, `${route}.mdx`),
    ];
    const pageFile = candidates.find(candidate => fs.existsSync(candidate));
    if (!pageFile) {
      return false;
    }

    const marker = REDIRECT_STUB_MARKERS.get(path.extname(pageFile));
    return marker ? fs.readFileSync(pageFile, 'utf-8').includes(marker) : false;
  });

  return new Set(stubUrls);
}

/**
 * Create a sitemap for crawlers like Algolia Docsearch.
 * This allows crawlers to index _all_ pages, without a full page-link-chain.
 */
export default function createSitemap({
  pathMap,
  domain,
  output,
  pathsPriority,
  pathsHidden,
  pagesDirectory,
  modificationDates = {},
}) {
  if (!pathMap) {
    throw new Error(`⚠️ Couldn't generate sitemap, no 'pathMap' provided`);
  }
  if (!domain) {
    throw new Error(`⚠️ Couldn't generate sitemap, no 'domain' provided`);
  }
  if (!output) {
    throw new Error(`⚠️ Couldn't generate sitemap, no 'output' provided`);
  }

  // Make sure both hidden and prioritized paths are prefixed with slash
  pathsPriority = pathsPriority.map(pathWithStartingSlash);
  pathsHidden = pathsHidden.map(pathWithStartingSlash);

  // Sitemaps should only list canonical content URLs, not redirect stubs
  const redirectStubs = pagesDirectory
    ? findRedirectStubUrls(pagesDirectory, Object.keys(pathMap))
    : new Set();

  // Get a list of URLs from the pathMap that we can use in the sitemap
  const urls = Object.keys(pathMap)
    .filter(
      url =>
        !IGNORED_PAGES.has(url) &&
        !redirectStubs.has(url) &&
        !pathsHidden.some(hidden => url.startsWith(hidden))
    )
    .map(pathWithTrailingSlash)
    .sort((a, b) => pathSortedByPriority(a, b, pathsPriority));

  const target = fs.createWriteStream(output);
  const sitemap = new SitemapStream({
    hostname: domain,
    xmlns: {
      news: false,
      xhtml: false,
      image: false,
      video: false,
    },
  });

  sitemap.pipe(target);
  urls.forEach(url => {
    const key = url.endsWith('/') ? url.slice(0, -1) : url;
    const lastmod = modificationDates[key];
    sitemap.write(lastmod ? { url, lastmod } : { url });
  });
  sitemap.end();

  return urls;
}

function pathWithTrailingSlash(url) {
  return !path.extname(url) && !url.endsWith('/') ? `${url}/` : url;
}

function pathWithStartingSlash(url) {
  return url.startsWith('/') ? url : `/${url}`;
}

/**
 * This will sort the paths by their priority.
 * It applies the following rules:
 *   - Index page is always moved to the top
 *   - Matches the order of prioritized paths using "startsWith" check
 */
export function pathSortedByPriority(a, b, priorities = []) {
  if (a === '/') {
    return -1;
  }
  if (b === '/') {
    return 1;
  }

  const aPriority = priorities.findIndex(prio => a.startsWith(prio));
  const bPriority = priorities.findIndex(prio => b.startsWith(prio));
  if (aPriority >= 0 && bPriority >= 0) {
    return aPriority - bPriority;
  }
  // Sort priority items before non-priority items
  if (aPriority >= 0) {
    return -1;
  }
  if (bPriority >= 0) {
    return 1;
  }

  return 0;
}
