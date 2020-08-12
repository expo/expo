import { uniq } from 'lodash';

const TOUCHED_PERMISSION_REGEX = new RegExp(
  /\+\s+<uses-permission*.+android:name="([a-zA-Z._-]+)"/,
  'i'
);

/**
 * This function checks if the Android Permissions was modified, using the following steps:
 * - Check if there was a change made in the `AndroidManifest.xml`.
 * - Check if a new `use-permissions` tag was added.
 * - Warn about also adding new permissions to the XDL blacklist.
 * - _Never_ fail CI, but add a warning to the PR as a reminder.
 */
export async function checkAndroidPermissions(): Promise<void> {
  const manifests = getTouchedManifests();
  if (manifests.length === 0) {
    console.log('Everything is ok 🎉');
    return;
  }

  const results = await Promise.all(
    manifests.map(async manifest => ({
      manifest,
      permissions: await getAddedManifestPermissions(manifest),
    }))
  );

  outputResult(results.filter(result => result.permissions.length > 0));
}

/**
 * Get a list of modified or created Android manifests, from danger's git.
 * This only returns `AndroidManifest.xml` files within the `packages/` folder.
 */
function getTouchedManifests(): string[] {
  const touchedFiles = [...danger.git.modified_files, ...danger.git.created_files];
  return uniq(
    touchedFiles.filter(file => file.startsWith('packages') && file.endsWith('AndroidManifest.xml'))
  );
}

/**
 * Determine if the Android manifest file has an added `use-permission` tag.
 */
async function getAddedManifestPermissions(filePath: string): Promise<string[]> {
  const result = await danger.git.diffForFile(filePath);
  if (!result) {
    return [];
  }

  return result.diff
    .split('\n')
    .map(line => line.match(TOUCHED_PERMISSION_REGEX)?.[1]?.trim() || '')
    .filter(Boolean);
}

/**
 * Generate a report and output a message warning for the added permissions in the Android manifest.
 */
function outputResult(results: { manifest: string; permissions: string[] }[]): void {
  if (results.length === 0) {
    return;
  }

  markdown(
    `#### ⚠ Android permissions added
Please make sure these permissions are absolutely required for the core functionality of the modules.
All permissions added in the Android Manifests are included, by default, in the standalone builds.

Alternatively, you can allow users to opt-out of the permission(s) by excluding them from the \`android.permissions\` manifest property.
For this, the permission(s) must be listed in the [XDL permissions blacklist](https://github.com/expo/expo-cli/blob/d75089b2e9f11b36f936967313d847fcc45f4e76/packages/xdl/src/detach/AndroidShellApp.js#L780).
`.trim()
  );

  results.forEach(result => {
    warn(`Permissions added: ${result.permissions.join(', ')}`, result.manifest);
  });
}
