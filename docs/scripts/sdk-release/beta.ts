// Cuts beta docs for a new SDK version and prints a JSON summary the docs-sdk-beta
// workflow uses to raise a PR. Run: pnpm sdk-beta --sdk 58 [--dry-run]

import { execFileSync, execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SDK_INPUT = /^(\d{2})(?:\.0\.0)?$/;
const LLMS_SOURCE_URL = 'https://docs.expo.dev/llms-sdk.txt';
const LLMS_MIN_BYTES = 500_000;
const EXPO_REGISTRY_URL = 'https://registry.npmjs.org/expo';
const CANARY_EXAMPLE = /`\d+\.\d+\.\d+-canary-\d{8}-[\da-f]+`/;

const docsDir = process.cwd();
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: docsDir,
  encoding: 'utf8',
}).trim();
const self = relative(root, fileURLToPath(import.meta.url));

const git = (...args: string[]) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' }).replace(/\n+$/, '');

const log = (message: string) => process.stderr.write(`${message}\n`);

function fail(what: string, why: string, how: string): never {
  log(`\n${what}\n${why}\n${how}\n`);
  process.exit(1);
}

function describeError(error: unknown) {
  const { stdout, stderr, message } = error as {
    stdout?: Buffer;
    stderr?: Buffer;
    message?: string;
  };
  const streams = [stdout, stderr]
    .map(stream => (stream ? String(stream).trim() : ''))
    .filter(Boolean)
    .join('\n');

  return streams || (message ?? String(error));
}

function parseOptions() {
  const argv = process.argv.slice(2);
  const overrides: Record<string, string> = {};
  let sdk = '';
  let dryRun = false;
  let skipLlms = false;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--sdk') {
      sdk = argv[++index] ?? '';
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--skip-llms') {
      skipLlms = true;
    } else if (arg === '--set') {
      const pair = argv[++index] ?? '';
      const splitAt = pair.indexOf('=');
      if (splitAt < 1) {
        fail(
          `Could not read --set "${pair}".`,
          'Each --set expects a key=value pair naming one field of the sdk-versions.json row.',
          'For example: --set react-native=0.87 --set xcode=27.0+'
        );
      }
      overrides[pair.slice(0, splitAt)] = pair.slice(splitAt + 1);
    } else {
      fail(
        `Unknown argument "${arg}".`,
        'Only --sdk, --dry-run, --skip-llms and --set are accepted.',
        'For example: pnpm sdk-beta --sdk 58 --dry-run'
      );
    }
  }

  return { sdk, dryRun, skipLlms, overrides };
}

const options = parseOptions();

const match = SDK_INPUT.exec(options.sdk);
if (!match) {
  fail(
    options.sdk ? `"${options.sdk}" is not a valid SDK version.` : 'No SDK version was given.',
    'The version selects the directories this script creates, so it is never inferred. A wrong value ' +
      'would generate hundreds of files under the wrong path.',
    'Pass a two-digit major, or its full form: pnpm sdk-beta --sdk 58'
  );
}

const major = match[1];
const version = `${major}.0.0`;
const versionDir = `v${version}`;

const packageJsonPath = join(docsDir, 'package.json');
const packageJsonText = readFileSync(packageJsonPath, 'utf8');
const packageJson = JSON.parse(packageJsonText) as { version: string; betaVersion?: string };
const currentVersion = packageJson.version;
const currentMajor = Number(currentVersion.split('.')[0]);

if (Number(major) <= currentMajor) {
  fail(
    `SDK ${major} is not newer than the current released version, ${currentVersion}.`,
    'The beta cut only ever creates a version above the one in docs/package.json, so this input would ' +
      'overwrite released reference docs.',
    `Pass a version above ${currentMajor}, or promote the current beta first if one is already open.`
  );
}

if (packageJson.betaVersion) {
  fail(
    `A beta cut is already open for SDK ${packageJson.betaVersion}.`,
    'docs/package.json still carries a betaVersion, so the previous beta was never promoted or reverted. ' +
      'Cutting a second beta on top of it would leave two unreleased versions visible.',
    'Promote or revert that beta first, then re-run this command.'
  );
}

const pagesDir = join(docsDir, 'pages', 'versions', versionDir);
if (existsSync(pagesDir)) {
  fail(
    `pages/versions/${versionDir} already exists.`,
    'et generate-sdk-docs skips directories that already exist rather than failing, so continuing would ' +
      'half-generate this release and leave the rest untouched.',
    `Remove pages/versions/${versionDir} and its public/static counterparts, or pick a different version.`
  );
}

const sdkVersionsPath = join(docsDir, 'ui', 'components', 'SDKTables', 'sdk-versions.json');
const sdkVersionsFields = Object.keys(
  (JSON.parse(readFileSync(sdkVersionsPath, 'utf8')) as { sdkVersions: Record<string, string>[] })
    .sdkVersions[0] ?? {}
);
const unknownOverride = Object.keys(options.overrides).find(
  key => !sdkVersionsFields.includes(key)
);

if (unknownOverride) {
  fail(
    `--set ${unknownOverride} does not match any field in the compatibility table.`,
    'Each --set writes one field of the new sdk-versions.json row, so an unrecognized key would be ' +
      'silently dropped instead of reaching the table.',
    `Use one of: ${sdkVersionsFields.filter(field => field !== 'sdk').join(', ')}.`
  );
}

if (!options.dryRun) {
  const dirtyFiles = git('status', '--porcelain')
    .split('\n')
    .filter(Boolean)
    .filter(line => line.slice(3) !== self);

  if (dirtyFiles.length) {
    fail(
      `The working tree has ${dirtyFiles.length} uncommitted change(s).`,
      'Every edit this script makes has to be attributable to the cut. A pnpm export run, for example, ' +
        'rewrites modificationDate across roughly 1,489 MDX files, which would land in the release PR.',
      'Commit, stash, or run git restore on the working tree, then re-run. To validate without writing, ' +
        'add --dry-run, which tolerates a dirty tree.'
    );
  }
}

log(`Cutting beta docs for SDK ${version} (current released: ${currentVersion})`);
if (options.dryRun) {
  log('Dry run: validating and reporting the plan, writing nothing.\n');
}

function expotools(args: string[]) {
  const hasEt = (() => {
    try {
      execFileSync('which', ['et'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  })();

  if (hasEt) {
    execFileSync('et', args, { cwd: root, stdio: 'pipe' });
    return;
  }

  const bin = join(root, 'tools', 'bin', 'expotools.js');
  if (!existsSync(bin)) {
    throw new Error(
      `expotools is not on PATH and ${relative(root, bin)} is missing. Run direnv allow in the repo ` +
        'root, or build expotools with pnpm turbo build --filter expotools...'
    );
  }
  execFileSync(process.execPath, [bin, ...args], { cwd: root, stdio: 'pipe' });
}

const notes: string[] = [];

async function updateCanaryExampleAsync() {
  const indexPath = join(docsDir, 'pages', 'versions', 'unversioned', 'index.mdx');
  const page = readFileSync(indexPath, 'utf8');
  const current = CANARY_EXAMPLE.exec(page);

  if (!current) {
    throw new Error(
      'Could not find a canary version example in pages/versions/unversioned/index.mdx. The Canary ' +
        'releases wording may have changed, so the example was left alone.'
    );
  }

  const response = await fetch(EXPO_REGISTRY_URL);
  if (!response.ok) {
    throw new Error(
      `Could not read the expo package from ${EXPO_REGISTRY_URL} (HTTP ${response.status}), so the ` +
        'canary example could not be refreshed.'
    );
  }

  const registry = (await response.json()) as Record<string, Record<string, string> | undefined>;
  const canary = registry['dist-tags']?.canary;

  if (!canary) {
    throw new Error(
      `${EXPO_REGISTRY_URL} has no canary dist-tag, so there is no published version to copy.`
    );
  }

  if (canary === current[0].replaceAll('`', '')) {
    notes.push(`Canary example was already \`${canary}\`.`);
    return;
  }

  writeFileSync(indexPath, page.replace(CANARY_EXAMPLE, `\`${canary}\``));

  notes.push(
    canary.startsWith(`${major}.`)
      ? `Canary example updated to \`${canary}\` (was ${current[0]}).`
      : `Canary example updated to \`${canary}\` (was ${current[0]}), but that is not an SDK ${major} ` +
          `build. Re-run this once main publishes a ${version} canary.`
  );
}

function regenerateUnversionedApiData() {
  expotools(['generate-docs-api-data']);
}

function generateVersionedDocs() {
  expotools(['generate-sdk-docs', '--sdk', version]);

  if (!existsSync(pagesDir)) {
    throw new Error(
      `et generate-sdk-docs reported success but pages/versions/${versionDir} was not created.`
    );
  }
}

function syncAppConfigSchema() {
  const schemasDir = join(docsDir, 'public', 'static', 'schemas');
  const schemaPath = join(schemasDir, versionDir, 'app-config-schema.json');

  let syncError = '';
  try {
    execSync(`pnpm schema-sync ${major}`, { cwd: docsDir, stdio: 'pipe' });
  } catch (error) {
    syncError = describeError(error).split('\n').at(-1) ?? '';
  }

  if (!existsSync(schemaPath)) {
    const unversionedSchema = join(schemasDir, 'unversioned', 'app-config-schema.json');

    if (!existsSync(unversionedSchema)) {
      throw new Error(
        `SDK ${version} has no published schema and public/static/schemas/unversioned/app-config-schema.json ` +
          `is missing, so there is nothing to fall back to. Run pnpm schema-sync unversioned first.`
      );
    }

    mkdirSync(dirname(schemaPath), { recursive: true });
    copyFileSync(unversionedSchema, schemaPath);
    notes.push(
      `SDK ${version} is not on exp.host or staging yet, so app-config-schema.json was copied from ` +
        `\`unversioned\` and the import still points at ${versionDir}. Re-run \`pnpm schema-sync ${major}\` ` +
        `once the ${version} schema is published (Release Workflow §0.2)${syncError ? `. Sync reported: ${syncError}` : '.'}`
    );
  }

  const appConfigPath = join(pagesDir, 'config', 'app.mdx');
  const appConfig = readFileSync(appConfigPath, 'utf8');
  const repointed = appConfig.replace(
    '~/public/static/schemas/unversioned/app-config-schema.json',
    `~/public/static/schemas/${versionDir}/app-config-schema.json`
  );

  if (repointed === appConfig) {
    throw new Error(
      `Could not repoint the schema import in pages/versions/${versionDir}/config/app.mdx. ` +
        'It no longer imports the unversioned schema, so the import path may have been restructured.'
    );
  }

  writeFileSync(appConfigPath, repointed);
}

function createNativeModulesStub() {
  const stubDir = join(docsDir, 'public', 'static', 'schemas', versionDir);
  const stubPath = join(stubDir, 'native-modules.json');

  if (existsSync(stubPath)) {
    notes.push(`native-modules.json already existed for ${versionDir} and was left alone.`);
    return;
  }

  mkdirSync(stubDir, { recursive: true });
  writeFileSync(stubPath, '{"versions":[]}');
  notes.push(
    `native-modules.json written as an empty stub. pnpm versions-schema-sync fills it once the SDK ` +
      `${version} packages are live; until then it keeps this snapshot.`
  );
}

async function archivePreviousLlmsBundleAsync() {
  const archiveName = `llms-sdk-v${currentVersion}.txt`;
  const archivePath = join(docsDir, 'public', archiveName);

  if (existsSync(archivePath)) {
    notes.push(`${archiveName} already existed and was left alone.`);
    return;
  }

  const response = await fetch(LLMS_SOURCE_URL);
  if (!response.ok) {
    throw new Error(
      `Could not download ${LLMS_SOURCE_URL} (HTTP ${response.status}). public/llms-sdk.txt is ` +
        'gitignored and only exists after a build, so the published bundle is the snapshot source.'
    );
  }

  const bundle = await response.text();
  const bytes = Buffer.byteLength(bundle);

  if (bytes < LLMS_MIN_BYTES) {
    throw new Error(
      `${LLMS_SOURCE_URL} returned only ${bytes} bytes, far below the expected size for an SDK bundle. ` +
        'Production may be mid-deploy. Re-run this step, or pass --skip-llms and archive it by hand.'
    );
  }

  if (!bundle.includes(`/versions/v${currentVersion}/`) && !bundle.includes('/versions/latest/')) {
    throw new Error(
      `${LLMS_SOURCE_URL} does not reference SDK ${currentVersion}, so it is not the snapshot this cut ` +
        'should archive. Check what production is currently serving as latest.'
    );
  }

  writeFileSync(archivePath, bundle);
  git('add', '--force', relative(root, archivePath));

  const llmsPagePath = join(docsDir, 'pages', 'llms.mdx');
  const llmsPage = readFileSync(llmsPagePath, 'utf8');
  const anchor = '<Collapsible summary="Looking for deprecated Expo SDK versions?">\n\n';

  if (!llmsPage.includes(anchor)) {
    throw new Error(
      'Could not find the deprecated-versions Collapsible in pages/llms.mdx, so the archive link was ' +
        `not added. Add a row for ${archiveName} by hand.`
    );
  }

  const row = `- [/${archiveName}](/${archiveName}): Documentation for the Expo SDK v${currentVersion}\n\n`;
  writeFileSync(llmsPagePath, llmsPage.replace(anchor, `${anchor}${row}`));
  notes.push(
    `${archiveName} archived from production (${(bytes / 1_000_000).toFixed(1)} MB) and force-added, ` +
      'since `public/llms-sdk-*.txt` is gitignored and the existing archives are tracked only because ' +
      'they were force-added too.'
  );
}

const carriedFields: string[] = [];

function planSdkVersionsRow() {
  const tablePath = join(docsDir, 'ui', 'components', 'SDKTables', 'sdk-versions.json');
  const table = JSON.parse(readFileSync(tablePath, 'utf8')) as {
    sdkVersions: Record<string, string>[];
  };

  if (table.sdkVersions.some(row => row.sdk === version)) {
    notes.push(`sdk-versions.json already had a row for ${version} and was left alone.`);
    return null;
  }

  const previous = table.sdkVersions[0];
  if (!previous) {
    throw new Error('sdk-versions.json has no existing rows to model the new one on.');
  }

  const row: Record<string, string> = { ...previous, sdk: version };
  for (const [key, value] of Object.entries(options.overrides)) {
    if (!(key in row)) {
      throw new Error(
        `--set ${key} does not match any field in sdk-versions.json. Valid fields: ` +
          `${Object.keys(previous).join(', ')}.`
      );
    }
    row[key] = value;
  }

  carriedFields.length = 0;
  for (const key of Object.keys(previous)) {
    if (key !== 'sdk' && !(key in options.overrides) && row[key] === previous[key]) {
      carriedFields.push(`${key}: \`${row[key]}\``);
    }
  }

  return { tablePath, table, row };
}

function addSdkVersionsRow() {
  const planned = planSdkVersionsRow();
  if (!planned) {
    return;
  }

  planned.table.sdkVersions.unshift(planned.row);
  writeFileSync(planned.tablePath, `${JSON.stringify(planned.table, null, 2)}\n`);
}

function setBetaVersion() {
  const updated = packageJsonText.replace(
    /("version":\s*"[^"]+",\n)/,
    `$1  "betaVersion": "${version}",\n`
  );

  if (updated === packageJsonText) {
    throw new Error(
      'Could not insert betaVersion after version in docs/package.json. The field order may have changed.'
    );
  }

  writeFileSync(packageJsonPath, updated);
}

const steps: {
  label: string;
  run: () => void | Promise<void>;
  preview?: () => void;
  skip?: boolean;
}[] = [
  { label: 'Refresh the canary example on the Reference index', run: updateCanaryExampleAsync },
  { label: 'Regenerate unversioned API data', run: regenerateUnversionedApiData },
  { label: `Generate ${versionDir} reference docs`, run: generateVersionedDocs },
  { label: 'Sync app config schema and repoint the import', run: syncAppConfigSchema },
  { label: 'Create the native-modules.json stub', run: createNativeModulesStub },
  {
    label: `Archive the SDK ${currentVersion} llms bundle`,
    run: archivePreviousLlmsBundleAsync,
    skip: options.skipLlms,
  },
  {
    label: `Add the ${version} compatibility row`,
    run: addSdkVersionsRow,
    preview: planSdkVersionsRow,
  },
  { label: `Set betaVersion to ${version}`, run: setBetaVersion },
];

const failures = new Map<string, string>();
const completed: string[] = [];
const skipped: string[] = [];

for (const { label, run, preview, skip } of steps) {
  if (skip) {
    log(`- skipped: ${label}`);
    skipped.push(label);
    continue;
  }

  if (options.dryRun) {
    log(`- would run: ${label}`);
    try {
      preview?.();
    } catch (error) {
      const output = describeError(error);
      log(`  preview failed: ${output}`);
      failures.set(label, output);
    }
    continue;
  }

  log(`- ${label}`);
  try {
    await run();
    completed.push(label);
  } catch (error) {
    const output = describeError(error);
    log(`  failed: ${output}`);
    failures.set(label, output);
  }
}

const changed = options.dryRun
  ? []
  : git('status', '--porcelain')
      .split('\n')
      .filter(Boolean)
      .map(line => line.slice(3))
      .filter(file => file !== self);

const HUMAN_TASKS = [
  'Re-check [brownfield install instructions](https://docs.expo.dev/brownfield/installing-expo-modules/) against the new template diff',
  'Backport any docs PRs merged to main since the branch point',
  `Run \`pnpm versions-schema-sync\` once the SDK ${version} packages are live on exp.host`,
];

const title = `[docs] Cut off SDK ${major} beta docs`;

const statusOf = (label: string) =>
  failures.has(label)
    ? '❌ Failed'
    : skipped.includes(label)
      ? '➖ Skipped'
      : options.dryRun
        ? '🔍 Planned'
        : '✅ Done';

const excerpt = (text: string) => text.split('\n').slice(-30).join('\n').slice(-2000);

const summaryByDirectory = changed.reduce<Record<string, number>>((counts, file) => {
  const key = file.split('/').slice(0, 4).join('/');
  counts[key] = (counts[key] ?? 0) + 1;
  return counts;
}, {});

const body = [
  `Beta docs cut for SDK ${version}, generated by \`pnpm sdk-beta --sdk ${major}\`.`,
  '',
  `\`docs/package.json\` keeps \`version\` at ${currentVersion} and gains \`betaVersion: ${version}\`, so`,
  'the new reference stays hidden in production until it is promoted.',
  '',
  '| Step | Status |',
  '| --- | --- |',
  ...steps.map(({ label }) => `| ${label} | ${statusOf(label)} |`),
  ...(Object.keys(summaryByDirectory).length
    ? [
        '',
        '## Files',
        '',
        '| Path | Files |',
        '| --- | --- |',
        ...Object.entries(summaryByDirectory)
          .sort((a, b) => b[1] - a[1])
          .map(([path, count]) => `| \`${path}\` | ${count} |`),
      ]
    : []),
  ...(carriedFields.length
    ? [
        '',
        '## Compatibility row needs review',
        '',
        `These fields were carried over unchanged from SDK ${currentVersion}. Confirm each one or push a fix:`,
        '',
        ...carriedFields.map(field => `- [ ] ${field}`),
      ]
    : []),
  '',
  '## Still to do by hand',
  '',
  ...HUMAN_TASKS.map(task => `- [ ] ${task}`),
  ...(notes.length ? ['', '## Notes', '', ...notes.map(note => `- ${note}`)] : []),
  ...(failures.size
    ? [
        '',
        '## Failures',
        ...[...failures].flatMap(([label, output]) => [
          '',
          '<details>',
          `<summary>${label}</summary>`,
          '',
          '```',
          excerpt(output),
          '```',
          '',
          '</details>',
        ]),
      ]
    : []),
].join('\n');

log(
  `\n${options.dryRun ? 'Dry run complete' : `${completed.length}/${steps.length - skipped.length} steps done`}` +
    `, ${changed.length} file(s) changed, ${failures.size} failure(s)`
);

process.stdout.write(
  JSON.stringify({
    hasChanged: changed.length > 0,
    failedCount: failures.size,
    dryRun: options.dryRun,
    sdkVersion: version,
    title,
    commitMessage: title,
    body,
  })
);
