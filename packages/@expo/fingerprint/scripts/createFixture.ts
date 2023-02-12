/**
 * Tool to generate vol JSON fixture from a project.
 *
 * Usage: npx ts-node scripts/createFixture /path/to/app /path/to/output.json
 */
import realFS from 'fs';
import glob from 'glob';
import { fs, vol } from 'memfs';
import path from 'path';

function globAsync(pattern: string, options: Parameters<typeof glob>[1]): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(pattern, options, (err, matches) => {
      if (err != null) {
        reject(err);
      } else {
        resolve(matches);
      }
    });
  });
}

async function createFixtureAsync(targetDir: string, outputFile: string) {
  const files = await globAsync('**/*', {
    cwd: targetDir,
    ignore: [
      // binary files
      '**/*.{jpg,png}',

      // lock files
      '**/*.lock',

      // node files
      '**/node_modules/**',

      // generated files
      '**/build/**',

      // ios files
      'ios/Pods/**',
      'vendor/**',
      '**/xcuserdata/**',
      '**/*.xcassets/**',
      '**/IDEWorkspaceChecks.plist',

      // android files
      '**/*.jar',
      '**/*.keystore',
      '**/gradlew',
      '**/gradlew.bat',
      '**/gradle/wrapper/**',
    ],
    nodir: true,
  });
  for (const file of files) {
    const content = realFS.readFileSync(path.join(targetDir, file), 'utf8');
    fs.mkdirSync(path.join('/', path.dirname(file)), { recursive: true });
    fs.writeFileSync(path.join('/', file), content);
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
