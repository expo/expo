// NOTE: This file is replicated to multiple packages! Keep these files in-sync:
// - packages/@expo/cli/src/utils/resolveGlobal.ts
// - packages/@expo/image-utils/src/resolveGlobal.ts

import { spawnSync } from 'child_process';
import fs from 'fs';
import Module from 'module';
import os from 'os';
import path from 'path';

declare module 'module' {
  namespace Module {
    const globalPaths: readonly string[] | void;
  }
}

const memoize = <Args extends any[], T>(fn: (...args: Args) => T): ((...args: Args) => T) => {
  let result: { value: T } | undefined;
  return (...args: Args): T => {
    if (result === undefined) {
      result = { value: fn(...args) };
    }
    return result.value;
  };
};

const isWindows = process.platform === 'win32';

const getDelimitedPaths = (delimited: string): string[] =>
  delimited
    .split(path.delimiter)
    .map((target) => {
      try {
        const normalized = path.normalize(target.trim());
        if (!normalized) {
          return null;
        } else if (!path.isAbsolute(normalized)) {
          return path.resolve(process.cwd(), normalized);
        } else {
          return normalized;
        }
      } catch {
        return null;
      }
    })
    .filter((target): target is string => !!target);

const execGetPaths = (cmd: string, args: string[]): string[] => {
  const result = spawnSync(cmd, args, { encoding: 'utf8' });
  if (!result.error && result.status === 0 && result.stdout) {
    const paths = getDelimitedPaths(result.stdout.replace(/[\r\n]+/g, path.delimiter));
    return paths.filter((target) => fs.existsSync(target));
  }
  return [];
};

const getNativeNodePaths = () => {
  if (Array.isArray(Module.globalPaths)) {
    return Module.globalPaths;
  } else {
    return [];
  }
};

const getHomePath = memoize(() => {
  try {
    return os.homedir();
  } catch {
    return isWindows ? (process.env.UserProfile ?? process.env.USERPROFILE) : process.env.HOME;
  }
});

const getNpmDefaultPaths = () => {
  const prefix = [];
  const localAppData = process.env.LocalAppData || process.env.LOCALAPPDATA;
  if (isWindows && localAppData) {
    prefix.push(path.resolve(localAppData, 'npm'));
  } else if (!isWindows) {
    prefix.push('/usr/local/lib/node_modules');
  }
  return prefix.filter((target) => fs.existsSync(target));
};

const getNpmPrefixPaths = memoize(() => {
  const npmPrefix = execGetPaths(isWindows ? 'npm.cmd' : 'npm', ['config', '-g', 'get', 'prefix']);
  return npmPrefix.map((prefix) => path.resolve(prefix, 'lib'));
});

const getYarnDefaultPaths = () => {
  const prefix = [];
  const homePath = getHomePath();
  const localAppData = process.env.LocalAppData || process.env.LOCALAPPDATA;
  const dataHomePath =
    process.env.XDG_DATA_HOME || (homePath && path.join(homePath, '.local', 'share'));
  if (isWindows && localAppData) {
    prefix.push(path.resolve(localAppData, 'Yarn', 'global'));
  }
  if (dataHomePath) {
    prefix.push(path.resolve(dataHomePath, 'yarn', 'global'));
  }
  if (homePath) {
    prefix.push(path.resolve(homePath, '.yarn', 'global'));
  }
  return prefix.filter((target) => fs.existsSync(target));
};

const getYarnPrefixPaths = memoize(() => {
  return execGetPaths(isWindows ? 'yarn.cmd' : 'yarn', ['global', 'dir']);
});

const getPnpmPrefixPaths = memoize(() => {
  return execGetPaths(isWindows ? 'pnpm.cmd' : 'pnpm', ['root', '-g']);
});

const getBunPrefixPaths = memoize(() => {
  const prefix = [];
  const bunPath = execGetPaths(isWindows ? 'bun.cmd' : 'bun', ['pm', 'bin', '-g'])[0];
  if (!bunPath) {
    return [];
  }
  prefix.push(path.resolve(bunPath, 'global'));
  const moduleEntry = fs.readdirSync(bunPath, { withFileTypes: true }).find((entry) => {
    return entry.isSymbolicLink() && entry.name !== 'global';
  });
  if (moduleEntry) {
    try {
      const moduleTarget = fs.realpathSync(path.resolve(bunPath, moduleEntry.name));
      const splitIdx = moduleTarget.indexOf(path.sep + 'node_modules' + path.sep);
      if (splitIdx > -1) {
        const modulePath = moduleTarget.slice(0, splitIdx);
        prefix.push(modulePath);
      }
    } catch {}
  }
  return prefix.filter((target) => fs.existsSync(target));
});

const getPaths = () => [
  ...getNpmDefaultPaths(),
  ...getNpmPrefixPaths(),
  ...getYarnDefaultPaths(),
  ...getYarnPrefixPaths(),
  ...getPnpmPrefixPaths(),
  ...getBunPrefixPaths(),
  ...getNativeNodePaths(),
  process.cwd(),
];

/** Resolve a globally installed module before a locally installed one */
export const resolveGlobal = (id: string): string => {
  return require.resolve(id, { paths: getPaths() });
};
