import findYarnWorkspaceRoot from 'find-yarn-workspace-root';

/** Wraps `find-yarn-workspace-root` and guards against having an empty `package.json` file in an upper directory. */
export function findWorkspaceRoot(projectRoot: string): string | null {
  try {
    return findYarnWorkspaceRoot(projectRoot);
  } catch (error: any) {
    if (error.message.includes('Unexpected end of JSON input')) {
      return null;
    }
    throw error;
  }
}
