import { createDevServerMiddleware as originalCreate } from '@expo/dev-server';

export function createDevServerMiddleware(
  projectRoot: string,
  {
    watchFolders,
    port,
  }: {
    watchFolders: readonly string[];
    port: number;
  }
) {
  return originalCreate(projectRoot, {
    port,
    watchFolders,
  });
}
