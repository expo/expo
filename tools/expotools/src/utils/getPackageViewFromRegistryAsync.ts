import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';

import { getExpoRepositoryRootDir } from '../Directories';

type PlainObjectType<V = any> = {
  [key: string]: V;
}

type PackageViewType = PlainObjectType & {
  'name': string;
  'dist-tags': PlainObjectType<string>;
  'versions': string[],
  'time': PlainObjectType<string> & {
    'created': string;
    'modified': string;
  };
  'maintainers': string[];
  'description': string;
  'author': string;
  // and more but these are the basic ones, we shouldn't need more.
}

async function spawnJSONCommandAsync(command: string, args: ReadonlyArray<string>, options: PlainObjectType = {}) {
  const child = await spawnAsync(command, args, {
    cwd: getExpoRepositoryRootDir(),
    ...options
  });
  return JSON.parse(child.stdout);
}

async function getPackageViewFromRegistryAsync(packageName: string): Promise<PackageViewType> {
  const json = await spawnJSONCommandAsync('npm', ['view', packageName, '--json']);
  return json;
}

export default getPackageViewFromRegistryAsync;
