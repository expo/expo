export function getDirFromFS(fsJSON: Record<string, string | null>, rootDir: string) {
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
