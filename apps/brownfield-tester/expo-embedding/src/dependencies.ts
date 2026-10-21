import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  renameSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

const lockfiles = {
  npm: ['package-lock.json', 'npm-shrinkwrap.json'],
  pnpm: ['pnpm-lock.yaml'],
  yarn: ['yarn.lock'],
  bun: ['bun.lock', 'bun.lockb'],
};

export function getInstallArguments(
  project: string,
  manager: keyof typeof lockfiles,
  frozen: boolean
): string[] {
  if (!frozen) return ['install'];
  if (!lockfiles[manager].some((file) => existsSync(join(project, file)))) {
    throw new Error(
      `A frozen ${manager} install requires a lockfile in ${project}. Run init locally and commit its lockfile before retrying --frozen-lockfile.`
    );
  }
  return manager === 'npm' ? ['ci'] : ['install', '--frozen-lockfile'];
}

export function getPackageManager(project: string): 'npm' | 'pnpm' | 'yarn' | 'bun' {
  const manifest = JSON.parse(readFileSync(join(project, 'package.json'), 'utf8'));
  if (manifest.packageManager) {
    const name = manifest.packageManager.split('@')[0];
    if (['npm', 'pnpm', 'yarn', 'bun'].includes(name)) return name;
    throw new Error(
      `Unsupported packageManager: ${manifest.packageManager}. Select npm, pnpm, yarn, or bun in expo/package.json.`
    );
  }
  const managers = (['npm', 'pnpm', 'yarn', 'bun'] as const).filter((name) => {
    return lockfiles[name].some((file) => existsSync(join(project, file)));
  });
  if (managers.length > 1) {
    throw new Error(
      'Multiple package manager lockfiles exist in expo/. Set packageManager in expo/package.json or remove the obsolete lockfiles, then rerun init.'
    );
  }
  return managers[0] ?? 'npm';
}

export function detachSharedNodeModules(project: string, frozen = false): string | undefined {
  const modules = join(project, 'node_modules');
  const stat = lstatSync(modules, { throwIfNoEntry: false });
  const manifest = JSON.parse(readFileSync(join(project, 'package.json'), 'utf8'));
  const declarations = {
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.optionalDependencies,
  };
  const isExternalLink = (path: string) => {
    if (!lstatSync(path).isSymbolicLink()) return false;
    const target = resolve(dirname(path), readlinkSync(path));
    const pathFromModules = relative(modules, target);
    return (
      pathFromModules === '..' || pathFromModules.startsWith('../') || isAbsolute(pathFromModules)
    );
  };
  const isLegacyPackage = (name: string) =>
    isExternalLink(join(modules, name)) &&
    !/^(file:|link:|workspace:)/.test(declarations[name] ?? '');
  const shared =
    stat &&
    (stat.isSymbolicLink() ||
      readdirSync(modules).some((name) => {
        if (name === '.bin') return isExternalLink(join(modules, name));
        if (name.startsWith('@')) {
          if (isExternalLink(join(modules, name))) return true;
          return readdirSync(join(modules, name)).some((child) =>
            isLegacyPackage(`${name}/${child}`)
          );
        }
        return !name.startsWith('.') && isLegacyPackage(name);
      }));
  const linkedLockfiles = ['package-lock.json', 'npm-shrinkwrap.json'].filter((name) => {
    const path = join(project, name);
    if (!existsSync(path)) return false;
    const lock = JSON.parse(readFileSync(path, 'utf8'));
    return Object.entries(declarations).some(([name, specifier]) => {
      const entry = lock.packages?.[`node_modules/${name}`];
      if (!entry?.link || !entry.resolved || /^(file:|link:|workspace:)/.test(String(specifier)))
        return false;
      const target = relative(project, resolve(project, entry.resolved));
      return target === '..' || target.startsWith('../') || isAbsolute(target);
    });
  });
  if (!shared && !linkedLockfiles.length) return;
  if (frozen) {
    throw new Error(
      'A frozen install cannot migrate legacy dependency links or lockfiles. Run init locally without --frozen-lockfile and commit the updated lockfile first.'
    );
  }

  // Move the links themselves; never modify the shared checkout they point at.
  const generated = join(dirname(project), '.expo-source');
  mkdirSync(generated, { recursive: true });
  const backup = mkdtempSync(join(generated, 'dependencies-backup-'));
  if (shared) renameSync(modules, join(backup, 'node_modules'));
  for (const name of linkedLockfiles) renameSync(join(project, name), join(backup, name));
  return backup;
}
