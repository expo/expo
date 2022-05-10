import path from 'path';

import { buildAsync } from './cli/commands/build';
import { initAsync } from './cli/commands/init';
import { getStoriesDir, getStoriesFile } from './cli/shared';

export async function withExpoStories(metroConfig: any) {
  const { projectRoot, expoRoot = '' } = metroConfig;

  const pkg = require(path.resolve(projectRoot, 'package.json'));

  const watchRoots: string[] = [];

  pkg.expo.symlinks.forEach((packageName) => {
    const pathToPackage = path.resolve(expoRoot, 'packages', packageName);
    watchRoots.push(pathToPackage);
  });

  await initAsync({ watchRoots, projectRoot });
  await buildAsync({ watchRoots, projectRoot });

  const storiesDir = getStoriesDir(metroConfig);
  const storyFile = getStoriesFile(metroConfig);

  metroConfig.watchFolders = [...watchRoots];
  metroConfig.watchFolders.push(projectRoot);
  metroConfig.watchFolders.push(storiesDir);

  metroConfig.resolver.extraNodeModules['generated-expo-stories'] = storyFile;

  metroConfig.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(expoRoot, 'packages'),
  ];

  // Use Node-style module resolution instead of Haste everywhere
  metroConfig.resolver.providesModuleNodeModules = [];

  // Ignore test files and JS files in the native Android and Xcode projects
  metroConfig.resolver.blockList = [
    /\/__tests__\/.*/,
    /.*\/android\/React(Android|Common)\/.*/,
    /.*\/versioned-react-native\/.*/,
  ];

  return metroConfig;
}
