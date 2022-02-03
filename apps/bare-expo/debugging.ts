function moduleNameFromPath(modulePath: string) {
  if (modulePath.startsWith('@')) {
    const [org, packageName] = modulePath.split('/');
    if (org && packageName) {
      return [org, packageName].join('/');
    }
    return modulePath;
  }
  const [packageName] = modulePath.split('/');
  return packageName ? packageName : modulePath;
}

function getNodeModuleName(
  filePath: string,
  appName: string,
  modulePathNames: string[]
): string | null {
  if (!filePath.startsWith('..')) {
    return appName || '[app]';
  }

  let modulePathName: string;

  for (const modulePath of modulePathNames) {
    if (filePath.includes(modulePath)) {
      modulePathName = modulePath;
      break;
    }
  }

  if (!modulePathName) {
    const comps = filePath.split(`../`);
    const modulePath = comps[comps.length - 1];
    if (modulePath) {
      return moduleNameFromPath(modulePath);
    }
    return null;
  }

  // '/Users/evanbacon/Documents/GitHub/lab/yolo5/node_modules/react-native-reanimated/ios/Nodes/REACallFuncNode.m'
  const [, modulePath] = filePath.split(`/${modulePathName}/`);
  if (modulePath) {
    return moduleNameFromPath(modulePath);
  }
  return null;
}

/**
 *
 * @param props.appName -- optional name in package.json
 * @param props.moduleImportPatterns -- list of directory patterns containing a node_module, defaults to ['node_modules']. Useful for monorepos.
 * @param props.printLoaded -- print all of the loaded module paths.
 *
 */
export function debugLoadedModules({
  appName,
  printLoaded,
  moduleImportPatterns = ['node_modules'],
}: {
  appName?: string;
  moduleImportPatterns?: string[];
  printLoaded?: boolean;
}) {
  function mapModules(modules: string[]): Record<string, string[]> {
    const nodeModuleMap: Record<string, string[]> = {};

    for (const mod of modules) {
      const name = getNodeModuleName(mod, appName, moduleImportPatterns || []) || 'unknown';
      if (!(name in nodeModuleMap)) {
        nodeModuleMap[name] = [];
      }
      nodeModuleMap[name].push(mod);
    }
    return nodeModuleMap;
  }

  // @ts-ignore
  const modules = require.getModules();
  const moduleIds = Object.keys(modules);

  const loadedModuleNames = moduleIds
    .filter(moduleId => modules[moduleId].isInitialized)
    .map(moduleId => modules[moduleId].verboseName);
  const waitingModuleNames = moduleIds
    .filter(moduleId => !modules[moduleId].isInitialized)
    .map(moduleId => modules[moduleId].verboseName);

  // make sure that the modules you expect to be waiting are actually waiting
  console.log(
    'Loaded modules:',
    loadedModuleNames.length,
    'Lazy loaded:',
    waitingModuleNames.length
  );

  const mappedLoaded = mapModules(loadedModuleNames);
  const sortedMap = Object.entries(mappedLoaded)
    .sort(([, a], [, b]) => {
      return b.length - a.length;
    })
    .map(([key, value]) => `> ${key}: ${value.length}`)
    .join('\n');
  console.log('Loaded map:\n' + sortedMap);

  if (mappedLoaded['unknown']) {
    console.log('unknown modules:');
    console.log(mappedLoaded['unknown']);
  }

  if (printLoaded) {
    console.log(JSON.stringify(loadedModuleNames.sort(), null, 2));
  }
}
