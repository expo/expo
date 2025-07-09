import { getMetroServerRoot } from '@expo/config/paths';
import path from 'path';

export function getModulesPaths(projectRoot: string): string[] {
  const paths: string[] = [];

  // Only add the project root if it's not the current working directory
  // this minimizes the chance of Metro resolver breaking on new Node.js versions.
  const resolvedProjectRoot = path.resolve(projectRoot);
  const workspaceRoot = getMetroServerRoot(resolvedProjectRoot);
  if (workspaceRoot !== resolvedProjectRoot) {
    paths.push(path.resolve(projectRoot, 'node_modules'));
    paths.push(path.resolve(workspaceRoot, 'node_modules'));
  }

  return paths;
}
