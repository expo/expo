import { Branch } from '../queries/useBranchesForApp';

export function getRecentRuntime(branches: Branch[]) {
  const recentBranchWithUpdates = branches.find((branch) => branch.updates.length > 0);
  const recentRuntime = recentBranchWithUpdates?.updates?.[0].runtimeVersion ?? '';
  return recentRuntime;
}
