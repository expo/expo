import { fetchAsync } from './rest/client';
import { ensureLoggedInAsync } from './user/actions';

export async function getProjectAsync(projectId: string): Promise<{ scopeKey: string }> {
  await ensureLoggedInAsync();
  const response = await fetchAsync(`projects/${encodeURIComponent(projectId)}`, {
    method: 'GET',
  });
  const { data } = await response.json();
  return data;
}
