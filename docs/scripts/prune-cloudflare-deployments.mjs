#!/usr/bin/env node
/**
 * Prunes old Cloudflare Pages deployments.
 *
 * Usage:
 *   node prune-cloudflare-deployments.mjs --project=expo-docs --branch=main --keep=10
 *   node prune-cloudflare-deployments.mjs --project=expo-docs --branch=pr-123 --keep=0
 *   node prune-cloudflare-deployments.mjs --project=expo-docs --branch=main --keep=10 --dry-run
 *
 * Environment:
 *   CLOUDFLARE_PAGES_API_TOKEN - API token with Pages Write permission
 *   CLOUDFLARE_ACCOUNT_ID - Cloudflare account ID
 */

import process from 'node:process';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
  options: {
    project: { type: 'string' },
    branch: { type: 'string' },
    keep: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
  },
});

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_PAGES_API_TOKEN;
const project = args.project;
const branch = args.branch;
const keep = parseInt(args.keep, 10);
const dryRun = args['dry-run'];

if (!accountId || !token) {
  console.error('Error: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_PAGES_API_TOKEN are required');
  process.exit(1);
}
if (!project || !branch || Number.isNaN(keep)) {
  console.error('Error: --project, --branch, and --keep are required');
  process.exit(1);
}

const api = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(project)}`;
const headers = { Authorization: `Bearer ${token}` };

async function fetchAllDeployments() {
  const deployments = [];
  let page = 1;
  while (true) {
    const response = await fetch(`${api}/deployments?page=${page}&per_page=25`, { headers });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message ?? 'API error');
    }
    deployments.push(...data.result);
    if (deployments.length >= data.result_info.total_count) {
      break;
    }
    page++;
  }
  return deployments;
}

console.log(`Fetching deployments for "${project}"...`);
const allDeployments = await fetchAllDeployments();

const branchDeployments = allDeployments
  .filter(d => d.deployment_trigger?.metadata?.branch === branch)
  .sort((a, b) => new Date(b.created_on) - new Date(a.created_on));

console.log(`Found ${branchDeployments.length} deployments for branch "${branch}"`);

const toDelete = branchDeployments.slice(keep);
if (toDelete.length === 0) {
  console.log('Nothing to delete');
  process.exit(0);
}

console.log(`Deleting ${toDelete.length} deployments${dryRun ? ' (dry run)' : ''}...`);

let deleted = 0;
let skipped = 0;

for (const deployment of toDelete) {
  const label = `${deployment.short_id ?? deployment.id.slice(0, 8)} (${deployment.created_on.slice(0, 10)})`;

  if (dryRun) {
    console.log(`  ${label}: would delete`);
    deleted++;
    continue;
  }

  const response = await fetch(`${api}/deployments/${encodeURIComponent(deployment.id)}`, {
    method: 'DELETE',
    headers,
  });
  const data = await response.json();

  if (data.success) {
    console.log(`  ${label}: deleted`);
    deleted++;
  } else {
    console.log(`  ${label}: skipped (${data.errors?.[0]?.message ?? 'unknown error'})`);
    skipped++;
  }
}

console.log(`\nDone: ${deleted} deleted, ${skipped} skipped`);
