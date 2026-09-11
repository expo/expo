/**
 * Post-build check that every internal link in the exported site resolves.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { normalizePath } from './paths.ts';
import { composeLinkReport, composePageView } from './report.ts';
import { scanSiteAsync } from './scan.ts';

const OUT_DIR = path.join(process.cwd(), 'out');
const REDIRECTS_FILE = path.join(process.cwd(), 'public/_redirects');

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  const value = process.argv[index + 1];
  if (!value) {
    console.error(`${flag} requires a value.`);
    process.exit(1);
  }
  return value;
}

async function mainAsync() {
  if (!fs.existsSync(OUT_DIR)) {
    console.warn(' \x1b[33m⚠\x1b[0m No out/ directory — run a build or export first, skipping');
    return;
  }

  const { report, issuesByPage } = await scanSiteAsync(OUT_DIR, REDIRECTS_FILE);

  const reportPath = argValue('--report');
  if (reportPath) {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  }

  const brokenTotal = report.broken.reduce((total, entry) => total + entry.count, 0);
  const anchorTotal = report.brokenAnchors.reduce((total, entry) => total + entry.count, 0);
  const dangling = report.danglingRedirects;

  const issueBodyPath = argValue('--issue-body');
  if (issueBodyPath) {
    const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
    const runUrl =
      GITHUB_SERVER_URL && GITHUB_REPOSITORY && GITHUB_RUN_ID
        ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`
        : undefined;
    const { title, body, hasFindings } = composeLinkReport(report, { date: new Date(), runUrl });
    if (hasFindings) {
      fs.writeFileSync(issueBodyPath, body + '\n');
      console.log(title);
    }
  } else {
    const pageFilter = argValue('--page');
    let view: string;
    if (pageFilter) {
      const page = normalizePath(pageFilter);
      const issues = issuesByPage.get(page);
      view = issues ? composePageView(new Map([[page, issues]]), []) : '';
      if (!view) {
        console.log(`\x1b[32m✓\x1b[0m No broken links on ${page}`);
      }
    } else {
      view = composePageView(issuesByPage, dangling);
    }
    if (view) {
      console.log(view);
    }
  }

  if (brokenTotal > 0 || dangling.length > 0 || anchorTotal > 0) {
    console.warn(
      `\n \x1b[1m\x1b[33m⚠\x1b[0m Report: ${brokenTotal} broken page link(s), ${dangling.length} dangling redirect(s), ${anchorTotal} broken anchor link(s), ${report.viaRedirect.length} via-redirect target(s)`
    );
    return;
  }

  console.warn(
    ` \x1b[1m\x1b[32m✓\x1b[0m All ${report.internalLinksChecked} internal links on ${report.pagesScanned} pages resolve`
  );
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  await mainAsync();
}
