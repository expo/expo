/**
 * Tool to generate vol JSON fixture from a project.
 *
 * Usage: npx ts-node scripts/createFixture /path/to/app /path/to/output.json
 */

import { fs, vol } from 'memfs';
import { Minimatch } from 'minimatch';
import realFS from 'node:fs';
import path from 'path';

async function createFixtureAsync(targetDir: string, outputFile: string) {
  const ignoredPatterns = [
    // binary files
    '**/*.{jpg,png,ttf}',

    // lock files
    '**/*.lock',
    '**/bun.lockb',

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
  ];
  const ignored = ignoredPatterns.map(
    (pattern) =>
      new Minimatch(pattern, {
        dot: true,
        nocase: process.platform === 'darwin' || process.platform === 'win32',
      })
  );
  for await (const entry of realFS.promises.glob('**/*', {
    cwd: targetDir,
    withFileTypes: true,
    exclude: (entry) => {
      const file = path.join(entry.parentPath, entry.name);
      const relative = path.relative(targetDir, file);
      return (
        ignored.some((pattern) => pattern.match(entry.isDirectory() ? `${relative}/` : relative)) ||
        (entry.isSymbolicLink() && !realFS.statSync(file, { throwIfNoEntry: false })?.isFile())
      );
    },
  })) {
    if (entry.isDirectory()) continue;
    const file = path.join(entry.parentPath, entry.name);
    const relative = path.relative(targetDir, file);
    // Older Node versions may yield files without applying exclude.
    if (
      ignored.some((pattern) => pattern.match(relative)) ||
      (!entry.isFile() &&
        (!entry.isSymbolicLink() || !realFS.statSync(file, { throwIfNoEntry: false })?.isFile()))
    ) {
      continue;
    }
    const content = realFS.readFileSync(file, 'utf8');
    fs.mkdirSync(path.join('/', path.dirname(relative)), { recursive: true });
    fs.writeFileSync(path.join('/', relative), content);
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
