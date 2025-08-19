import path from 'path';

const requireResolveBasepath = (request: string, params?: { paths?: string[] }) =>
  path.dirname(require.resolve(`${request}/package.json`, params));

const expoMetroBasepath = requireResolveBasepath('@expo/metro');

const MODULE_RESOLUTIONS: Record<string, string> = {
  metro: expoMetroBasepath,
  'metro-babel-transformer': expoMetroBasepath,
  'metro-cache': expoMetroBasepath,
  'metro-cache-key': expoMetroBasepath,
  'metro-config': expoMetroBasepath,
  'metro-core': expoMetroBasepath,
  'metro-file-map': expoMetroBasepath,
  'metro-resolver': expoMetroBasepath,
  'metro-runtime': expoMetroBasepath,
  'metro-source-map': expoMetroBasepath,
  'metro-transform-plugins': expoMetroBasepath,
  'metro-transform-worker': expoMetroBasepath,
  '@expo/metro-config': requireResolveBasepath('expo'),
};

const escapeDependencyName = (dependency: string) =>
  dependency.replace(/[*.?()[\]]/g, (x) => `\\${x}`);
const dependenciesToRegex = (dependencies: string[]) =>
  new RegExp(`^(${dependencies.map(escapeDependencyName).join('|')})($|/.*)`);

export const createStickyModuleMapper = () => {
  const moduleTestRe = dependenciesToRegex(Object.keys(MODULE_RESOLUTIONS));
  return (request: string, parentId?: string): string | null => {
    if (!parentId) {
      return null;
    }
    const moduleMatch = moduleTestRe.exec(request);
    if (moduleMatch) {
      const moduleSearchPath = MODULE_RESOLUTIONS[moduleMatch[1] as string];
      if (moduleSearchPath) {
        return require.resolve(request, { paths: [moduleSearchPath] });
      }
    }
    return null;
  };
};
