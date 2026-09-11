import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';

import { collectIds, hasAnchor } from './anchors.ts';
import { classifyHref, type ClassifiedLink, type ValidSets } from './classify.ts';
import { pagePathFromHtmlFile } from './paths.ts';
import { parseRedirects, validateRedirectTargets, type RedirectRule } from './redirects.ts';

export type ReportEntry = { target: string; count: number; pages: string[]; pageCount: number };

export type LinkReport = {
  generatedAt: string;
  pagesScanned: number;
  internalLinksChecked: number;
  broken: ReportEntry[];
  brokenAnchors: ReportEntry[];
  viaRedirect: ReportEntry[];
  danglingRedirects: RedirectRule[];
};

export type PageIssue = {
  kind: 'broken' | 'anchor' | 'via-redirect';
  target: string;
  count: number;
  hash?: string;
  self?: boolean;
};

export type ScanResult = {
  report: LinkReport;
  issuesByPage: Map<string, PageIssue[]>;
};

export function isScannedSource(pagePath: string): boolean {
  if (pagePath === '/internal' || pagePath.startsWith('/internal/')) {
    return false;
  }
  if (pagePath === '/versions/unversioned' || pagePath.startsWith('/versions/unversioned/')) {
    return true;
  }
  return !(pagePath === '/versions' || pagePath.startsWith('/versions/'));
}

type Aggregate = { target: string; count: number; pages: Set<string> };

function findAllFiles(dir: string, root: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_next') {
        continue;
      }
      findAllFiles(full, root, acc);
    } else {
      acc.push(`/${path.relative(root, full).replace(/\\/g, '/')}`);
    }
  }
  return acc;
}

function toReport(aggregates: Map<string, Aggregate>): ReportEntry[] {
  return [...aggregates.values()]
    .sort((a, b) => b.count - a.count)
    .map(({ target, count, pages }) => ({
      target,
      count,
      pages: [...pages].sort(),
      pageCount: pages.size,
    }));
}

function addToAggregate(bucket: Map<string, Aggregate>, target: string, page: string) {
  const aggregate = bucket.get(target) ?? { target, count: 0, pages: new Set<string>() };
  aggregate.count++;
  aggregate.pages.add(page);
  bucket.set(target, aggregate);
}

export async function scanSiteAsync(outDir: string, redirectsFile: string): Promise<ScanResult> {
  const { findHtmlPages } = await import('../../scripts/generate-markdown-pages-utils.ts');
  const htmlFiles = findHtmlPages(outDir);
  if (htmlFiles.length === 0) {
    throw new Error('No HTML pages found in out/. Did the build run?');
  }

  const pages = new Set(htmlFiles.map((file: string) => pagePathFromHtmlFile(outDir, file)));
  const files = new Set(findAllFiles(outDir, outDir));
  const redirects = parseRedirects(fs.readFileSync(redirectsFile, 'utf-8'));
  const sets: ValidSets = { pages, files, redirects };

  const dangling = validateRedirectTargets(redirects, pages, files);

  const broken = new Map<string, Aggregate>();
  const viaRedirect = new Map<string, Aggregate>();
  const cache = new Map<string, ClassifiedLink>();
  const idsByPage = new Map<string, Set<string>>();
  const anchorChecks: { source: string; target: string; hash: string }[] = [];

  const issuesByPage = new Map<string, PageIssue[]>();
  const issuesByKey = new Map<string, PageIssue>();
  const addIssue = (page: string, issue: Omit<PageIssue, 'count'>) => {
    const key = `${page}|${issue.kind}|${issue.target}|${issue.hash ?? ''}`;
    const seen = issuesByKey.get(key);
    if (seen) {
      seen.count++;
      return;
    }
    const tracked = { ...issue, count: 1 };
    issuesByKey.set(key, tracked);
    const list = issuesByPage.get(page) ?? [];
    list.push(tracked);
    issuesByPage.set(page, list);
  };

  let linksChecked = 0;

  for (const htmlFile of htmlFiles) {
    const pagePath = pagePathFromHtmlFile(outDir, htmlFile);
    const $ = cheerio.load(fs.readFileSync(htmlFile, 'utf-8'));
    idsByPage.set(pagePath, collectIds($));
    if (!isScannedSource(pagePath)) {
      continue;
    }

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href')!;
      const cacheKey = href.startsWith('/') || href.includes('://') ? href : `${pagePath}\0${href}`;

      let result = cache.get(cacheKey);
      if (!result) {
        result = classifyHref(href, pagePath, sets);
        cache.set(cacheKey, result);
      }
      if (result.kind === 'skip' || result.kind === 'external') {
        return;
      }
      linksChecked++;

      if (result.kind === 'page' && result.hash) {
        anchorChecks.push({ source: pagePath, target: result.target!, hash: result.hash });
      }

      if (result.kind === 'broken') {
        addToAggregate(broken, result.target!, pagePath);
        addIssue(pagePath, { kind: 'broken', target: result.target! });
      } else if (result.kind === 'via-redirect') {
        addToAggregate(viaRedirect, result.target!, pagePath);
        addIssue(pagePath, { kind: 'via-redirect', target: result.target! });
      }
    });
  }

  const brokenAnchors = new Map<string, Aggregate>();
  for (const { source, target, hash } of anchorChecks) {
    if (hasAnchor(idsByPage, target, hash)) {
      continue;
    }
    addToAggregate(brokenAnchors, `${target}#${hash}`, source);
    addIssue(source, { kind: 'anchor', target, hash, self: source === target });
  }

  return {
    report: {
      generatedAt: new Date().toISOString(),
      pagesScanned: htmlFiles.length,
      internalLinksChecked: linksChecked,
      broken: toReport(broken),
      brokenAnchors: toReport(brokenAnchors),
      viaRedirect: toReport(viaRedirect),
      danglingRedirects: dangling,
    },
    issuesByPage,
  };
}
