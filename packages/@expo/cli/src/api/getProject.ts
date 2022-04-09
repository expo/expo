import { CommandError } from '../utils/errors';
import { fetchAsync } from './rest/client';
import { ensureLoggedInAsync } from './user/actions';

interface Project {
  accountId: string;
  createdAt: string;
  fullName: string;
  id: string;
  latestPublishedTime: null | unknown;
  latestReleaseId: null | unknown;
  latestRevisionId: null | unknown;
  originalFullName: string;
  packageUsername: string;
  pageViewCount: null | unknown;
  privacy: string;
  pushSecurityEnabled: boolean;
  scopeKey: string;
  updatedAt: string;
  viewTrendScore: null | unknown;
}

export async function getProjectAsync(projectId: string): Promise<Project> {
  await ensureLoggedInAsync();
  const response = await fetchAsync(`projects/${encodeURIComponent(projectId)}`);
  if (!response.ok) {
    throw new CommandError('API', `Unexpected error from Expo servers: ${response.statusText}.`);
  }
  const { data } = await response.json();
  return data;
}
