/**
 * Tool to generate vol JSON fixture from a project.
 *
 * Usage: npx ts-node scripts/createFixture /path/to/app /path/to/output.json
 */
import realFS from 'fs';
import { fs, vol } from 'memfs';
import path from 'path';

async function createFixtureAsync(targetDir: string, outputFile: string) {
  const directories = [''];
  for (const directory of directories) {
    const entries = await realFS.promises.readdir(path.join(targetDir, directory), {
      withFileTypes: true,
    });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (
          !['node_modules', 'build', 'xcuserdata'].includes(entry.name) &&
          !entry.name.endsWith('.xcassets') &&
          !['ios/Pods', 'vendor', 'gradle/wrapper'].includes(file) &&
          !file.endsWith('/gradle/wrapper')
        ) {
          directories.push(file);
        }
      } else if (
        !/\.(jpg|png|ttf|lock|jar|keystore)$/.test(entry.name) &&
        !['bun.lockb', 'IDEWorkspaceChecks.plist', 'gradlew', 'gradlew.bat'].includes(entry.name) &&
        (entry.isFile() ||
          (entry.isSymbolicLink() &&
            realFS.statSync(path.join(targetDir, file), { throwIfNoEntry: false })?.isFile()))
      ) {
        const content = realFS.readFileSync(path.join(targetDir, file), 'utf8');
        fs.mkdirSync(path.join('/', path.dirname(file)), { recursive: true });
        fs.writeFileSync(path.join('/', file), content);
      }
    }
  }
  const resultJSON: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(vol.toJSON())) {
    resultJSON[path.join('/app', path.relative('/', key))] = value;
  }
  realFS.writeFileSync(outputFile, JSON.stringify(resultJSON, null, 2));
}

(async () => {
  if (process.argv.length !== 4) {
    console.log(`Usage: ${path.basename(process.argv[1])} targetDir outputFile`);
    process.exit(1);
  }
  const targetDir = process.argv[2];
  const outputFile = process.argv[3];

  try {
    await createFixtureAsync(targetDir, outputFile);
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();
