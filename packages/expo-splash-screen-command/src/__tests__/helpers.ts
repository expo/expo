/**
 * Filters out only these files that belong to given rootDir and removes files that are `nulls`, because that the way that `memfs` marks file deletion
 * Each file path is then converted to relative (without starting `/` or `./`)
 * @param fsJSON
 * @param rootDir
 */
export function getDirFromFS(fsJSON: Record<string, string>, rootDir: string) {
  return Object.entries(fsJSON)
    .filter(([path, value]) => value !== null && path.startsWith(rootDir))
    .reduce<Record<string, string>>(
      (acc, [path, fileContent]) => ({
        ...acc,
        [path.substring(rootDir.length).startsWith('/')
          ? path.substring(rootDir.length + 1)
          : path.substring(rootDir.length)]: fileContent,
      }),
      {}
    );
}
