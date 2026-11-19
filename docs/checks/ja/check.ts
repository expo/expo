import { findStalePages } from './sync.ts';

const { checked, stale } = findStalePages();
const annotation = process.env.GITHUB_ACTIONS === 'true' ? '::warning::' : '';

for (const key of stale) {
  console.log(
    `${annotation}pages/ja/${key} is stale because its English source changed since the last sync. After the English change merges, the Docs Japanese Sync workflow opens a PR that updates it. To sync it by hand, update the translation and run pnpm ja:stamp ${key}.`
  );
}

console.log(
  stale.length === 0
    ? `All ${checked} Japanese pages are in sync with their English sources.`
    : `${stale.length} of ${checked} Japanese pages need a sync.`
);
