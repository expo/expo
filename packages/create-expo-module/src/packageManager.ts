import spawnAsync from '@expo/spawn-async';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const;
export type PackageManagerName = (typeof PACKAGE_MANAGERS)[number];

export function isPackageManagerName(value: string | undefined): value is PackageManagerName {
  return !!value && (PACKAGE_MANAGERS as readonly string[]).includes(value);
}

/** Determine which package manager to use for installing dependencies based on how the process was started. */
export function resolvePackageManager(): PackageManagerName {
  // Attempt to detect if the user started the command using `yarn` or `pnpm`
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent?.startsWith('yarn')) {
    return 'yarn';
  } else if (userAgent?.startsWith('pnpm')) {
    return 'pnpm';
  } else if (userAgent?.startsWith('npm')) {
    return 'npm';
  } else if (userAgent?.startsWith('bun')) {
    return 'bun';
  }

  // Try availability
  if (isPackageManagerAvailable('yarn')) {
    return 'yarn';
  } else if (isPackageManagerAvailable('pnpm')) {
    return 'pnpm';
  } else if (isPackageManagerAvailable('bun')) {
    return 'bun';
  }

  return 'npm';
}

function isPackageManagerAvailable(manager: PackageManagerName): boolean {
  try {
    execSync(`${manager} --version`, { stdio: 'ignore' });
    return true;
  } catch {}
  return false;
}

export function formatRunCommand(manager: PackageManagerName, cmd: string) {
  switch (manager) {
    case 'pnpm':
      return `pnpm run ${cmd}`;
    case 'yarn':
      return `yarn ${cmd}`;
    case 'bun':
      return `bun run ${cmd}`;
    case 'npm':
    default:
      return `npm run ${cmd}`;
  }
}

/**
 * Whether a new standalone module needs its own `pnpm-workspace.yaml` for pnpm settings. pnpm 11
 * and later fail the install when build scripts are neither allowed nor disallowed, which the file
 * configures. A module that is a project of an existing pnpm workspace uses that workspace's
 * settings. Call it once the module's `package.json` exists.
 */
export function shouldCreatePnpmWorkspace(
  packageManager: PackageManagerName,
  targetDir: string
): boolean {
  if (packageManager !== 'pnpm' || getPnpmMajorVersion(targetDir) < 11) {
    return false;
  }
  // pnpm uses the closest `pnpm-workspace.yaml` in the parent directories as the workspace root
  for (let dir = path.dirname(targetDir); ; dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
      return !isPnpmWorkspaceProject(dir, targetDir);
    }
    if (path.dirname(dir) === dir) {
      return true;
    }
  }
}

/** Whether the workspace's `packages` globs include the project, as listed by pnpm */
function isPnpmWorkspaceProject(workspaceRoot: string, projectDir: string): boolean {
  try {
    const output = execSync('pnpm ls --recursive --depth -1 --json', {
      cwd: workspaceRoot,
      encoding: 'utf8',
    });
    // Skip warnings that pnpm may print before the JSON output
    const projects: { path: string }[] = JSON.parse(output.slice(output.search(/^\[\s*[{\]]/m)));
    const projectPath = fs.realpathSync(projectDir);
    return projects.some((project) => fs.realpathSync(project.path) === projectPath);
  } catch {
    // Assume the module belongs to the workspace, so that the workspace's settings apply
    return true;
  }
}

function getPnpmMajorVersion(cwd: string): number {
  try {
    // pnpm may print warnings before the version, e.g. about the project's `packageManager` field
    const output = execSync('pnpm --version', { cwd, encoding: 'utf8' });
    const match = output.match(/^(\d+)\.\d+\.\d+/m);
    return match ? Number(match[1]) : 0;
  } catch {
    return 0;
  }
}

/** Install dependencies with the given package manager */
export async function installDependencies(
  packageManager: PackageManagerName,
  appPath: string,
  ...args: string[]
) {
  try {
    return await spawnAsync(packageManager, ['install', ...args], {
      cwd: appPath,
    });
  } catch (error: any) {
    // pnpm 11 prints its errors to stdout, pnpm 12 to stderr
    const output = [error?.stdout, error?.stderr].filter(Boolean).join('\n');
    if (packageManager === 'pnpm' && output.includes('ERR_PNPM_IGNORED_BUILDS')) {
      // A module created in an existing pnpm workspace uses that workspace's settings, see `shouldCreatePnpmWorkspace`
      throw new Error(
        `pnpm couldn't install the dependencies in ${appPath}, because some of them have build scripts that pnpm's settings neither allow nor disallow. ` +
          `Creating the module stopped at this step. Run \`pnpm approve-builds\` in ${appPath}, or set each package listed below to \`true\` or \`false\` under \`allowBuilds\` in the pnpm-workspace.yaml that pnpm uses for that directory (in your workspace root, or in that directory if it isn't part of a workspace). ` +
          `pnpm 12 and later already list them there with a placeholder value. \`false\` is enough for packages that ship prebuilt binaries, such as Jest's dependencies. ` +
          `Then run create-expo-module again with the same options.\n\npnpm output:\n${output}`
      );
    }
    throw new Error(
      `${packageManager} install exited with non-zero code: ${error?.status}\n\nError stack:\n${error?.stderr}`
    );
  }
}
