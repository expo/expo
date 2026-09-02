// @ref llp/0007-deploy-and-headless.rfc.md §deploy — "agent mode returns structured
// URLs and status". The URLs are the whole point of a deploy, and today they only exist as text in
// the `eas` output, so they are scraped here.
//
// Best-effort by construction: the exact wording of the EAS CLI is not a contract, so a miss
// returns null and the raw tail travels in the payload instead. The proper fix is an upstream
// machine-readable output for `eas deploy`/`eas build` — the same "gaps become upstream
// improvements" rule as llp/0006 §The process boundary.

import { stripVTControlCharacters } from 'util';

/** Labels the EAS CLI puts in front of the URL a deployment answers on. */
const DEPLOYMENT_URL_LABEL = /(?:deployment|production|preview|website)\s*url:?\s*(\S+)/i;
/** EAS Hosting serves deployments from this domain, which is what makes a bare URL recognizable. */
const HOSTING_URL = /https?:\/\/[^\s]*\.expo\.app[^\s]*/gi;

/** Trailing characters that belong to the sentence a URL was printed in, not to the URL. */
function trimUrl(url: string): string {
  return url.replace(/[).,;:'"\]]+$/, '');
}

/**
 * The URL a web deployment answers on, read from the `eas deploy` output.
 *
 * A labelled URL wins; otherwise the last hosting URL in the output does, because a run that
 * prints several ends on the one it just created.
 *
 * @returns the URL, or null when the output holds none.
 */
export function parseDeploymentUrl(output: string): string | null {
  const text = stripVTControlCharacters(output);

  const labelled = text.match(DEPLOYMENT_URL_LABEL);
  if (labelled?.[1]) {
    const url = trimUrl(labelled[1]);
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
  }

  const matches = text.match(HOSTING_URL);
  return matches?.length ? trimUrl(matches[matches.length - 1]!) : null;
}

/**
 * The last lines of a captured run.
 *
 * This travels in the `--json` payload: when a URL could not be parsed, the agent still sees what
 * the tool actually said, and does not have to re-run a deploy to find out.
 */
export function outputTail(output: string, maxLines: number): string {
  return stripVTControlCharacters(output)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .slice(-maxLines)
    .join('\n');
}
