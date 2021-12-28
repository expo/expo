import { fetchCurrentLinearData } from './cache';
import { readPackages } from './helpers';
import { createOrUpdateIssues } from './issues';

async function createAuditIssues(options: { packageNames: string[] }) {
  const packages = await readPackages(options.packageNames);
  await fetchCurrentLinearData();
  await createOrUpdateIssues(packages);
}

export default createAuditIssues;
