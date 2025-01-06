import fs from 'fs';
import path from 'path';
import { SitemapStream } from 'sitemap';

const IGNORED_PAGES = [
  '/404', // We don't want to add the 404 error page as sitemap entry
  '/versions', // Skip the redirect to latest, use `/versions/latest` instead
];

/**
 * Create a sitemap for crawlers like Algolia Docsearch.
 * This allows crawlers to index _all_ pages, without a full page-link-chain.
 */
export default function createSitemap({ pathMap, domain, output, pathsPriority, pathsHidden }) {
  if (!pathMap) throw new Error(`⚠️ Couldn't generate sitemap, no 'pathMap' provided`);
  if (!domain) throw new Error(`⚠️ Couldn't generate sitemap, no 'domain' provided`);
  if (!output) throw new Error(`⚠️ Couldn't generate sitemap, no 'output' provided`);

  // Make sure both hidden and prioritized paths are prefixed with slash
  pathsPriority = pathsPriority.map(pathWithStartingSlash);
  pathsHidden = pathsHidden.map(pathWithStartingSlash);

  // Get a list of URLs from the pathMap that we can use in the sitemap
  const urls = Object.keys(pathMap)
    .filter(
      url => !IGNORED_PAGES.includes(url) && !pathsHidden.find(hidden => url.startsWith(hidden))
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
  urls.forEach(url => sitemap.write({ url }));
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
function pathSortedByPriority(a, b, priorities = []) {
  if (a === '/') return -1;
  if (b === '/') return 1;

  const aPriority = priorities.findIndex(prio => a.startsWith(prio));
  const bPriority = priorities.findIndex(prio => b.startsWith(prio));
  if (aPriority >= 0 || bPriority >= 0) {
    return aPriority - bPriority;
  }

  return 0;
}
