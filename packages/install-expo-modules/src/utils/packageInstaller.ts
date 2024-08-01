import * as PackageManager from '@expo/package-manager';
import path from 'path';
import semver from 'semver';

/**
 * Install a node package non-interactively
 *
 * @param projectRoot target project root folder
 * @param pkg package name
 */
async function installPackageNonInteractiveAsync(projectRoot: string, pkg: string) {
  const manager = PackageManager.createForProject(projectRoot, { silent: false });

  if (manager.name === 'yarn') {
    const version = await manager.versionAsync();
    if (semver.major(version) === 1) {
      return manager.addAsync([pkg, '--non-interactive']);
    }
  }

  return manager.addAsync([pkg]);
}

/**
 * Install the `expo` package
 *
 * @param projectRoot target project root folder
 * @param sdkVersion expo sdk version
 */
export async function installExpoPackageAsync(projectRoot: string, sdkVersion: string) {
  try {
    // First try to install from released versions, e.g. `expo@^45.0.0`
    await installPackageNonInteractiveAsync(projectRoot, `expo@^${sdkVersion}`);
  } catch {
    // Fallback to install from prerelease versions,
    // e.g. `expo@>=45.0.0-0 <46.0.0`, this will cover prerelease version for beta testing.
    await installPackageNonInteractiveAsync(
      projectRoot,
      `expo@>=${sdkVersion}-0 <${semver.inc(sdkVersion, 'major')}`
    );
  }
}

/**
 * Running `pod install` for the target project
 *
 * @param projectRoot target project root folder
 */
export async function installPodsAsync(projectRoot: string) {
  const podPackageManager = new PackageManager.CocoaPodsPackageManager({
    cwd: path.join(projectRoot, 'ios'),
  });
  await podPackageManager.installAsync();
}
