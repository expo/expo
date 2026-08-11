// Cuts beta docs for a new SDK version and prints a JSON summary the docs-sdk-beta
// workflow uses to raise a PR. Run: pnpm sdk-beta --sdk 58 [--dry-run].

import type { SdkCompatibility, SdkCompatibilityData } from '@expo/sdk-compatibility/types';
import { execFileSync, execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

// Docs CI does not build workspace packages, and Node cannot type-strip TypeScript from
// node_modules, so load the dependency-free validator directly from repository source.
import { createSdkCompatibilityDataValidator } from '../../../packages/@expo/sdk-compatibility/src/validation.ts';

const SDK_INPUT = /^(\d{2})(?:\.0\.0)?$/;
const EXPO_DIST_TAGS_URL = 'https://registry.npmjs.org/-/package/expo/dist-tags';
const CANARY_EXAMPLE = /`\d+\.\d+\.\d+-canary-\d{8}-[\da-f]+`/;
const EXPOTOOLS_MAX_BUFFER = 64 * 1024 * 1024;
const SDK_COMPATIBILITY_OVERRIDE_FIELDS = [
  'android',
  'compileSdkVersion',
  'targetSdkVersion',
  'buildToolsVersion',
  'ios',
  'xcode',
  'react-native',
  'react-native-web',
  'react-native-tvos',
  'react',
  'node',
] as const;
const validateSdkCompatibilityData = createSdkCompatibilityDataValidator(semver);

const docsDir = process.cwd();
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: docsDir,
  encoding: 'utf8',
}).trim();
const self = relative(root, fileURLToPath(import.meta.url));
const sdkCompatibilityPath = join(
  root,
  'packages',
  '@expo',
  'sdk-compatibility',
  'src',
  'sdk-compatibility.json'
);

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
  let commitPerStep = false;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--sdk') {
      sdk = argv[++index] ?? '';
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--commit-per-step') {
      commitPerStep = true;
    } else if (arg === '--set') {
      const pair = argv[++index] ?? '';
      const splitAt = pair.indexOf('=');
      if (splitAt < 1) {
        fail(
          `Could not read --set "${pair}".`,
          'Each --set expects a key=value pair naming one SDK compatibility field.',
          'For example: --set react-native=0.87 --set xcode=27.0+'
        );
      }
      overrides[pair.slice(0, splitAt)] = pair.slice(splitAt + 1);
    } else {
      fail(
        `Unknown argument "${arg}".`,
        'Only --sdk, --dry-run, --commit-per-step and --set are accepted.',
        'For example: pnpm sdk-beta --sdk 58 --dry-run'
      );
    }
  }

  return { sdk, dryRun, commitPerStep, overrides };
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

const unknownOverride = Object.keys(options.overrides).find(
  key => !(SDK_COMPATIBILITY_OVERRIDE_FIELDS as readonly string[]).includes(key)
);

if (unknownOverride) {
  fail(
    `--set ${unknownOverride} does not match any field in the compatibility table.`,
    'Each --set writes one field of the shared SDK compatibility row, so an unrecognized key would be ' +
      'silently dropped instead of reaching the table.',
    `Use one of: ${SDK_COMPATIBILITY_OVERRIDE_FIELDS.join(', ')}.`
  );
}

if (!options.dryRun) {
  const dirtyFiles = git('status', '--porcelain', '--untracked-files=all')
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
    execFileSync('et', args, { cwd: root, stdio: 'pipe', maxBuffer: EXPOTOOLS_MAX_BUFFER });
    return;
  }

  const bin = join(root, 'tools', 'bin', 'expotools.js');
  if (!existsSync(bin)) {
    throw new Error(
      `expotools is not on PATH and ${relative(root, bin)} is missing. Run direnv allow in the repo ` +
        'root, or build expotools with pnpm turbo build --filter expotools...'
    );
  }
  execFileSync(process.execPath, [bin, ...args], {
    cwd: root,
    stdio: 'pipe',
    maxBuffer: EXPOTOOLS_MAX_BUFFER,
  });
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

  const response = await fetch(EXPO_DIST_TAGS_URL);
  if (!response.ok) {
    throw new Error(
      `Could not read the expo dist-tags from ${EXPO_DIST_TAGS_URL} (HTTP ${response.status}), so the ` +
        'canary example could not be refreshed.'
    );
  }

  const distTags = (await response.json()) as Record<string, string | undefined>;
  const canary = distTags.canary;

  if (!canary) {
    throw new Error(
      `${EXPO_DIST_TAGS_URL} has no canary dist-tag, so there is no published version to copy.`
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

function addStaticDataTypeLinks() {
  const staticDataPath = join(docsDir, 'components', 'plugins', 'api', 'APIStaticData.ts');
  const source = readFileSync(staticDataPath, 'utf8');

  if (source.includes(`'${versionDir}': {`)) {
    notes.push(`APIStaticData.ts already had a ${versionDir} block and was left alone.`);
    return;
  }

  const unversioned = /^ {2}unversioned: {\n([\S\s]*?)^ {2}},\n/m.exec(source);
  if (!unversioned?.[1]) {
    throw new Error(
      'Could not find the unversioned block in components/plugins/api/APIStaticData.ts, so the ' +
        `${versionDir} type links were not added. The sdkVersionHardcodedTypeLinks shape may have changed.`
    );
  }

  const anchor = /^ {2}latest: {$/m;
  if (!anchor.test(source)) {
    throw new Error(
      'Could not find the latest block in components/plugins/api/APIStaticData.ts, so there was no ' +
        `place to insert ${versionDir} ahead of it.`
    );
  }

  const body = unversioned[1].replaceAll('/versions/unversioned/', `/versions/${versionDir}/`);
  const block = `  '${versionDir}': {\n${body}  },\n`;

  writeFileSync(staticDataPath, source.replace(anchor, `${block}  latest: {`));
  execSync(`pnpm exec oxfmt --write ${relative(docsDir, staticDataPath)}`, {
    cwd: docsDir,
    stdio: 'pipe',
  });

  const linkCount = body.split(`/versions/${versionDir}/`).length - 1;
  notes.push(`Cloned ${linkCount} hardcoded type links from \`unversioned\` into ${versionDir}.`);
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

const carriedFields: string[] = [];

function readSdkCompatibilityData(): SdkCompatibilityData {
  return JSON.parse(readFileSync(sdkCompatibilityPath, 'utf8')) as SdkCompatibilityData;
}

function parseIntegerOverride(field: string, value: string) {
  const normalized = value.replace(/\+$/, '');
  const parsed = normalized ? Number(normalized) : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`--set ${field}=${value} must contain a non-negative integer.`);
  }
  return parsed;
}

function normalizeThreePartVersion(value: string, field: string) {
  if (!/^\d+(?:\.\d+){1,2}$/.test(value)) {
    throw new Error(`--set ${field}=${value} must contain a numeric version.`);
  }
  return value.split('.').length === 2 ? `${value}.0` : value;
}

function parseXcodeVersionRange(value: string) {
  if (value.endsWith('+')) {
    return `>=${normalizeThreePartVersion(value.slice(0, -1), 'xcode')}`;
  }

  const boundedRange = /^(\d+(?:\.\d+){1,2})\s+-\s+(\d+(?:\.\d+){1,2})$/.exec(value);
  if (boundedRange) {
    return `>=${normalizeThreePartVersion(boundedRange[1], 'xcode')} <=${normalizeThreePartVersion(
      boundedRange[2],
      'xcode'
    )}`;
  }

  throw new Error(
    `--set xcode=${value} must use a minimum such as 26.4+ or a range such as 15.4 - 16.2.`
  );
}

function parseNodeMinimumVersion(value: string) {
  const documentationVersion = /^(\d+\.\d+)\.x$/.exec(value);
  return documentationVersion
    ? `${documentationVersion[1]}.0`
    : normalizeThreePartVersion(value, 'node');
}

function formatXcodeVersionRange(range: string) {
  const boundedRange = /^>=(\d+\.\d+)(?:\.0)? <=(\d+\.\d+)(?:\.0)?$/.exec(range);
  if (boundedRange) {
    return `${boundedRange[1]} - ${boundedRange[2]}`;
  }

  const minimumRange = /^>=(\d+\.\d+)(?:\.0)?$/.exec(range);
  return minimumRange ? `${minimumRange[1]}+` : range;
}

function formatNodeMinimumVersion(version: string) {
  const minimumVersion = /^(\d+\.\d+)\.0$/.exec(version);
  return minimumVersion ? `${minimumVersion[1]}.x` : version;
}

function applyCompatibilityOverride(row: SdkCompatibility, field: string, value: string) {
  switch (field) {
    case 'android':
      row.android.minimumVersion = parseIntegerOverride(field, value);
      break;
    case 'compileSdkVersion':
      row.android.compileSdkVersion = parseIntegerOverride(field, value);
      break;
    case 'targetSdkVersion':
      row.android.targetSdkVersion = parseIntegerOverride(field, value);
      break;
    case 'buildToolsVersion':
      row.android.buildToolsVersion = normalizeThreePartVersion(value, field);
      break;
    case 'ios':
      row.ios.minimumVersion = value.replace(/\+$/, '');
      break;
    case 'xcode':
      row.ios.xcodeVersionRange = parseXcodeVersionRange(value);
      break;
    case 'react-native':
      row.runtime.reactNative = value;
      break;
    case 'react-native-web':
      row.runtime.reactNativeWeb = value;
      break;
    case 'react-native-tvos':
      row.runtime.reactNativeTvos = value;
      break;
    case 'react':
      row.runtime.react = normalizeThreePartVersion(value, field);
      break;
    case 'node':
      row.node = { minimumVersion: parseNodeMinimumVersion(value) };
      break;
    default:
      throw new Error(`Unsupported SDK compatibility field: ${field}`);
  }
}

function readCompatibilityField(row: SdkCompatibility, field: string) {
  switch (field) {
    case 'android':
      return `${row.android.minimumVersion}+`;
    case 'compileSdkVersion':
      return String(row.android.compileSdkVersion);
    case 'targetSdkVersion':
      return row.android.targetSdkVersion?.toString() ?? '';
    case 'buildToolsVersion':
      return row.android.buildToolsVersion ?? '';
    case 'ios':
      return `${row.ios.minimumVersion}+`;
    case 'xcode':
      return formatXcodeVersionRange(row.ios.xcodeVersionRange);
    case 'react-native':
      return row.runtime.reactNative;
    case 'react-native-web':
      return row.runtime.reactNativeWeb;
    case 'react-native-tvos':
      return row.runtime.reactNativeTvos ?? '';
    case 'react':
      return row.runtime.react ?? '';
    case 'node':
      return row.node ? formatNodeMinimumVersion(row.node.minimumVersion) : '';
    default:
      throw new Error(`Unsupported SDK compatibility field: ${field}`);
  }
}

function planSdkVersionsRow() {
  const table = readSdkCompatibilityData();

  if (table.sdkVersions.some(row => row.sdk === version)) {
    notes.push(`sdk-compatibility.json already had a row for ${version} and was left alone.`);
    return null;
  }

  const previous = table.sdkVersions[0];
  if (!previous) {
    throw new Error('sdk-compatibility.json has no existing rows to model the new one on.');
  }

  const row = structuredClone(previous);
  if (row.ios.xcodeVersionCheckRange) {
    notes.push(
      `The Xcode enforcement range \`${row.ios.xcodeVersionCheckRange}\` from SDK ${currentVersion} was not carried forward. Add \`ios.xcodeVersionCheckRange\` only after confirming a known incompatibility for SDK ${version}.`
    );
    delete row.ios.xcodeVersionCheckRange;
  }
  row.sdk = version;
  for (const [key, value] of Object.entries(options.overrides)) {
    applyCompatibilityOverride(row, key, value);
  }

  carriedFields.length = 0;
  for (const key of SDK_COMPATIBILITY_OVERRIDE_FIELDS) {
    if (!(key in options.overrides)) {
      carriedFields.push(`${key}: \`${readCompatibilityField(row, key)}\``);
    }
  }

  const updatedTable = { ...table, sdkVersions: [row, ...table.sdkVersions] };
  const validationErrors = validateSdkCompatibilityData(updatedTable);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid SDK compatibility row:\n- ${validationErrors.join('\n- ')}`);
  }
  return updatedTable;
}

function addSdkVersionsRow() {
  const updatedTable = planSdkVersionsRow();
  if (!updatedTable) {
    return;
  }

  writeFileSync(sdkCompatibilityPath, `${JSON.stringify(updatedTable, null, 2)}\n`);
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
}[] = [
  { label: 'Refresh the canary example on the Reference index', run: updateCanaryExampleAsync },
  { label: 'Regenerate unversioned API data', run: regenerateUnversionedApiData },
  { label: `Generate ${versionDir} reference docs`, run: generateVersionedDocs },
  { label: `Clone hardcoded type links into ${versionDir}`, run: addStaticDataTypeLinks },
  { label: 'Sync app config schema and repoint the import', run: syncAppConfigSchema },
  { label: 'Create the native-modules.json stub', run: createNativeModulesStub },
  {
    label: `Add the ${version} compatibility row`,
    run: addSdkVersionsRow,
    preview: planSdkVersionsRow,
  },
  { label: `Set betaVersion to ${version}`, run: setBetaVersion },
];

const failures = new Map<string, string>();
const completed: string[] = [];

const startSha = git('rev-parse', 'HEAD');

function commitStep(label: string) {
  const dirty = git('status', '--porcelain', '--untracked-files=all')
    .split('\n')
    .filter(Boolean)
    .some(line => line.slice(3) !== self);

  if (!dirty) {
    return;
  }

  git('add', '--all', '--', '.', `:!${self}`);
  git(
    'commit',
    '-m',
    `[docs] SDK ${major} beta: ${label}${failures.has(label) ? ' (failed)' : ''}`
  );
  log(`  committed as ${git('rev-parse', '--short', 'HEAD')}`);
}

for (const { label, run, preview } of steps) {
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

  if (options.commitPerStep) {
    commitStep(label);
  }
}

const changed = options.dryRun
  ? []
  : [
      ...new Set([
        ...(options.commitPerStep
          ? git('diff', '--name-only', startSha, 'HEAD').split('\n').filter(Boolean)
          : []),
        ...git('status', '--porcelain', '--untracked-files=all')
          .split('\n')
          .filter(Boolean)
          .map(line => line.slice(3))
          .filter(file => file !== self),
      ]),
    ];

const HUMAN_TASKS = [
  'Re-check [brownfield install instructions](https://docs.expo.dev/brownfield/installing-expo-modules/) against the new template diff',
  'Backport any docs PRs merged to main since the branch point',
  `Run \`pnpm versions-schema-sync\` once the SDK ${version} packages are live on exp.host`,
];

const title = `[docs] Cut off SDK ${major} beta docs`;

const statusOf = (label: string) =>
  failures.has(label) ? '❌ Failed' : options.dryRun ? '🔍 Planned' : '✅ Done';

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
  `\n${options.dryRun ? 'Dry run complete' : `${completed.length}/${steps.length} steps done`}` +
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
