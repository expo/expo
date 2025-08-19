import path from 'path';

export const moduleRootPaths = [
  path.dirname(require.resolve('../../../package.json')),
  path.dirname(require.resolve('@expo/metro/package.json')),
  path.dirname(require.resolve('expo/package.json')),
];

const escapeDependencyName = (dependency: string) =>
  dependency.replace(/[*.?()[\]]/g, (x) => `\\${x}`);
const dependenciesToRegex = (dependencies: string[]) =>
  new RegExp(`^(${dependencies.map(escapeDependencyName).join('|')})($|/.*)`);

const isInModuleRootPath = (targetPath: string) =>
  moduleRootPaths.some((moduleRootPath) => targetPath.startsWith(moduleRootPath));

export const createStickyModuleMapper = (moduleNames: string[]) => {
  const modulePathMap = moduleNames.reduce(
    (modulePaths, moduleName) => {
      try {
        modulePaths[moduleName] = path.dirname(
          require.resolve(`${moduleName}/package.json`, { paths: moduleRootPaths })
        );
      } catch {}
      return modulePaths;
    },
    {} as Record<string, string>
  );
  const moduleTestRe = dependenciesToRegex(Object.keys(modulePathMap));
  return (request: string, parentId?: string): string | null => {
    if (!parentId || isInModuleRootPath(parentId)) {
      return null;
    }
    const moduleMatch = moduleTestRe.exec(request);
    if (moduleMatch) {
      const targetModulePath = modulePathMap[moduleMatch[1]];
      if (targetModulePath) {
        return `${targetModulePath}${moduleMatch[2] || ''}`;
      }
    }
    return null;
  };
};
