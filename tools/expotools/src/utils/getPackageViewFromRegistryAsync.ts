import spawnAsync from '@expo/spawn-async';

import { getExpoRepositoryRootDir } from '../Directories';

type PackageViewType = {
  name: string;
  'dist-tags': { [tag: string]: string };
  versions: string[];
  time: {
    created: string;
    modified: string;
    [time: string]: string;
  };
  maintainers: string[];
  description: string;
  author: string;
  // and more but these are the basic ones, we shouldn't need more.
  [key: string]: any;
};

async function spawnJSONCommandAsync(
  command: string,
  args: ReadonlyArray<string>,
  options: object = {}
) {
  const child = await spawnAsync(command, args, {
    cwd: getExpoRepositoryRootDir(),
    ...options,
  });
  return JSON.parse(child.stdout);
}

async function getPackageViewFromRegistryAsync(packageName: string): Promise<PackageViewType> {
  const json = await spawnJSONCommandAsync('npm', ['view', packageName, '--json']);
  return json;
}

export { PackageViewType };
export default getPackageViewFromRegistryAsync;
