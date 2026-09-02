// F29: the Expo CLI's failure message for a `--check` run describes one state and is printed for
// three. These tests pin which of them this CLI corrects — against a manifest on the in-memory
// file system, because the whole point of the diagnosis is that it reads the file the message
// makes a claim about.
import { vol } from 'memfs';

import { diagnoseCheckedPackagesAsync } from '../checkReport';

const projectRoot = '/project';

afterEach(() => {
  vol.reset();
});

/** Write a manifest, and install the packages named in `installed` into `node_modules`. */
function writeProject(
  dependencies: Record<string, string>,
  installed: string[] = Object.keys(dependencies)
): void {
  const files: Record<string, string> = {
    [`${projectRoot}/package.json`]: JSON.stringify({ name: 'app', dependencies }),
  };
  for (const name of installed) {
    files[`${projectRoot}/node_modules/${name}/package.json`] = '{"version":"1.0.0"}';
  }
  vol.fromJSON(files);
}

describe(diagnoseCheckedPackagesAsync, () => {
  // The state the friction run hit, and the one the Expo CLI's message gets wrong: it says the
  // package "is added as a dependency in your project's package.json", and it is not there at all.
  it(`should say a package is not in package.json when it is not`, async () => {
    writeProject({ expo: '57.0.15' });

    const notes = await diagnoseCheckedPackagesAsync(projectRoot, [
      '@react-native-async-storage/async-storage',
    ]);

    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain(
      `"@react-native-async-storage/async-storage" is not in this project's package.json`
    );
    expect(notes[0]).toContain(
      'npx @expo/agent-cli install @react-native-async-storage/async-storage'
    );
  });

  // The state the message *does* describe. Nothing to correct, so the note only says what to run.
  it(`should say the dependencies were never installed when the manifest names the package`, async () => {
    writeProject({ expo: '57.0.15', 'expo-camera': '~17.0.0' }, ['expo']);

    const notes = await diagnoseCheckedPackagesAsync(projectRoot, ['expo-camera']);

    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain("is in this project's package.json but not in node_modules");
  });

  // A package that is declared and installed failed the *version* check, which is what `--check`
  // is for, and the Expo CLI's own report says it better than a note could.
  it(`should add nothing for a package that is declared and installed`, async () => {
    writeProject({ 'expo-camera': '~17.0.0' });

    await expect(diagnoseCheckedPackagesAsync(projectRoot, ['expo-camera'])).resolves.toEqual([]);
  });

  it(`should read the version range off a spec`, async () => {
    writeProject({ 'expo-camera': '~17.0.0' });

    await expect(
      diagnoseCheckedPackagesAsync(projectRoot, ['expo-camera@~17.0.0'])
    ).resolves.toEqual([]);
  });

  it(`should have nothing to say about a check that named no package`, async () => {
    writeProject({ expo: '57.0.15' });

    await expect(diagnoseCheckedPackagesAsync(projectRoot, [])).resolves.toEqual([]);
  });

  // A manifest that cannot be read is answered rather than thrown on: the note list is an
  // improvement on the report, not a precondition for one.
  it(`should not throw when the project has no readable manifest`, async () => {
    await expect(diagnoseCheckedPackagesAsync(projectRoot, ['expo-camera'])).resolves.toHaveLength(
      1
    );
  });
});
