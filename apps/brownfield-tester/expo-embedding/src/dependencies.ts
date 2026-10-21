import { lstat, mkdir, mkdtemp, readlink, readdir, rename } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

import { exists, readJSON } from './files';
const lockfiles = {
  npm: ['package-lock.json', 'npm-shrinkwrap.json'],
  pnpm: ['pnpm-lock.yaml'],
  yarn: ['yarn.lock'],
  bun: ['bun.lock', 'bun.lockb'],
};

export async function getInstallArguments(
  project: string,
  manager: keyof typeof lockfiles,
  frozen: boolean
): Promise<string[]> {
  if (!frozen) return ['install'];
  if (
    !(await Promise.all(lockfiles[manager].map((file) => exists(join(project, file))))).some(
      Boolean
    )
  ) {
    throw new Error(
      `A frozen ${manager} install requires a lockfile in ${project}. Run init locally and commit its lockfile before retrying --frozen-lockfile.`
    );
  }
  return manager === 'npm' ? ['ci'] : ['install', '--frozen-lockfile'];
}

export async function getPackageManager(project: string): Promise<'npm' | 'pnpm' | 'yarn' | 'bun'> {
  const manifest = await readJSON(join(project, 'package.json'));
  if (manifest.packageManager) {
    const name = manifest.packageManager.split('@')[0];
    if (['npm', 'pnpm', 'yarn', 'bun'].includes(name)) return name;
    throw new Error(
      `Unsupported packageManager: ${manifest.packageManager}. Select npm, pnpm, yarn, or bun in expo/package.json.`
    );
  }
  const managers: (keyof typeof lockfiles)[] = [];
  for (const name of ['npm', 'pnpm', 'yarn', 'bun'] as const) {
    if (
      (await Promise.all(lockfiles[name].map((file) => exists(join(project, file))))).some(Boolean)
    )
      managers.push(name);
  }
  if (managers.length > 1) {
    throw new Error(
      'Multiple package manager lockfiles exist in expo/. Set packageManager in expo/package.json or remove the obsolete lockfiles, then rerun init.'
    );
  }
  return managers[0] ?? 'npm';
}

export async function detachSharedNodeModules(
  project: string,
  frozen = false
): Promise<string | undefined> {
  const modules = join(project, 'node_modules');
  const stat = await lstat(modules).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  const manifest = await readJSON(join(project, 'package.json'));
  const declarations = {
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.optionalDependencies,
  };
  const isExternalLink = async (path: string) => {
    if (!(await lstat(path)).isSymbolicLink()) return false;
    const target = resolve(dirname(path), await readlink(path));
    const pathFromModules = relative(modules, target);
    return (
      pathFromModules === '..' || pathFromModules.startsWith('../') || isAbsolute(pathFromModules)
    );
  };
  const isLegacyPackage = async (name: string) =>
    (await isExternalLink(join(modules, name))) &&
    !/^(file:|link:|workspace:)/.test(declarations[name] ?? '');
  let shared = stat?.isSymbolicLink() ?? false;
  if (stat?.isDirectory()) {
    for (const name of await readdir(modules)) {
      if (name === '.bin') shared ||= await isExternalLink(join(modules, name));
      else if (name.startsWith('@')) {
        shared ||= await isExternalLink(join(modules, name));
        if (!shared) {
          for (const child of await readdir(join(modules, name))) {
            shared ||= await isLegacyPackage(`${name}/${child}`);
          }
        }
      } else if (!name.startsWith('.')) shared ||= await isLegacyPackage(name);
      if (shared) break;
    }
  }
  const linkedLockfiles: string[] = [];
  for (const name of ['package-lock.json', 'npm-shrinkwrap.json']) {
    const path = join(project, name);
    if (!(await exists(path))) continue;
    const lock = await readJSON(path);
    const hasExternalLink = Object.entries(declarations).some(([name, specifier]) => {
      const entry = lock.packages?.[`node_modules/${name}`];
      if (!entry?.link || !entry.resolved || /^(file:|link:|workspace:)/.test(String(specifier)))
        return false;
      const target = relative(project, resolve(project, entry.resolved));
      return target === '..' || target.startsWith('../') || isAbsolute(target);
    });
    if (hasExternalLink) linkedLockfiles.push(name);
  }
  if (!shared && !linkedLockfiles.length) return;
  if (frozen) {
    throw new Error(
      'A frozen install cannot migrate legacy dependency links or lockfiles. Run init locally without --frozen-lockfile and commit the updated lockfile first.'
    );
  }

  // Move the links themselves; never modify the shared checkout they point at.
  const generated = join(dirname(project), '.expo-source');
  await mkdir(generated, { recursive: true });
  const backup = await mkdtemp(join(generated, 'dependencies-backup-'));
  if (shared) await rename(modules, join(backup, 'node_modules'));
  for (const name of linkedLockfiles) await rename(join(project, name), join(backup, name));
  return backup;
}
