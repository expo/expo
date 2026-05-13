import chalk from 'chalk';
import prompts from 'prompts';

import { ALIASES } from './legacyTemplates';
import { Log } from './log';
import { formatSelfCommand } from './resolvePackageManager';
import { env } from './utils/env';
import { splitNpmNameAndTag } from './utils/npm';

const debug = require('debug')('expo:init:sdk') as typeof console.log;

// SDKs without a `releaseNoteUrl` are canary/in-development. The top-level
// `expoGoSdkVersion` reports the SDK currently shipping in store Expo Go and
// is treated as optional — when absent, the "For learning with Expo Go" choice
// is hidden.
const VERSIONS_URL = 'https://api.expo.dev/v2/versions';

type VersionsResponse = {
  expoGoSdkVersion?: string;
  sdkVersions?: Record<string, { releaseNoteUrl?: string; isDeprecated?: boolean }>;
};

type SdkVersionsSummary = {
  /** Highest released SDK major version (highest entry with a releaseNoteUrl). */
  latest: number;
  /** Major SDK version currently shipping in the App Store / Play Store version of Expo Go. */
  expoGoCompatible: number | null;
  /** All released SDK major versions, sorted descending. */
  available: number[];
};

export async function fetchSdkVersionsAsync(): Promise<SdkVersionsSummary | null> {
  let json: VersionsResponse;
  try {
    const response = await fetch(VERSIONS_URL);
    if (!response.ok) {
      debug(`versions endpoint returned ${response.status}`);
      return null;
    }
    json = (await response.json()) as VersionsResponse;
  } catch (error) {
    debug('Failed to fetch versions endpoint:', error);
    return null;
  }

  const sdkVersions = json.sdkVersions ?? {};
  const available = Object.entries(sdkVersions)
    .filter(([, info]) => !!info.releaseNoteUrl && !info.isDeprecated)
    .map(([version]) => parseSdkMajor(version))
    .filter((major): major is number => major != null)
    .sort((a, b) => b - a);

  const latest = available[0];
  if (latest == null) {
    return null;
  }

  return {
    latest,
    expoGoCompatible: parseSdkMajor(json.expoGoSdkVersion),
    available,
  };
}

function parseSdkMajor(version: string | undefined): number | null {
  const major = parseInt(version?.split('.')[0] ?? '', 10);
  return Number.isFinite(major) ? major : null;
}

/**
 * If the resolved template is an Expo-published template without an explicit
 * SDK tag, prompt the user to pick which Expo SDK to use and return the
 * template name with the chosen SDK tag appended.
 *
 * Returns the template unchanged if the user is non-interactive, the template
 * already targets a specific version, or we can't reach the versions endpoint.
 */
export async function applySdkVersionToTemplateAsync(
  template: string,
  {
    yes,
    showAlternatives = true,
    projectName,
  }: { yes: boolean; showAlternatives?: boolean; projectName?: string }
): Promise<string> {
  if (env.EXPO_BETA) {
    logCreatingProject(template, projectName);
    return template;
  }

  const [name, tag] = splitNpmNameAndTag(template);
  if (tag) {
    logCreatingProject(template, projectName);
    return template;
  }
  if (!isKnownExpoTemplate(name)) {
    logCreatingProject(template, projectName);
    return template;
  }

  const nonInteractive = yes || env.CI || !process.stdin.isTTY;

  // Non-interactive + user explicitly chose a template: fall through to that
  // template's npm `latest` dist-tag. No need to fetch the versions endpoint.
  if (nonInteractive && !showAlternatives) {
    logCreatingProject(template, projectName);
    return template;
  }

  const versions = await fetchSdkVersionsAsync();
  if (!versions) {
    logCreatingProject(template, projectName);
    return template;
  }

  // Non-interactive + default template: pin to the actual latest released SDK.
  if (nonInteractive) {
    const pinned = `${name}@sdk-${versions.latest}`;
    logCreatingProject(pinned, projectName);
    return pinned;
  }

  const selectedSdk = await promptSdkVersionAsync(versions, name, showAlternatives, projectName);
  if (selectedSdk == null) {
    logCreatingProject(template, projectName);
    return template;
  }

  return `${name}@sdk-${selectedSdk}`;
}

function logCreatingProject(template: string, projectName: string | undefined): void {
  const subject = projectName ? chalk.cyan(projectName) : 'a project';
  console.log(chalk`Creating ${subject} using the {cyan ${template}} template.\n`);
}

function isKnownExpoTemplate(name: string): boolean {
  if (ALIASES.includes(name)) {
    return true;
  }
  // Short aliases like `default` and `blank` are expanded to `expo-template-*` later.
  return ALIASES.includes(`expo-template-${name}`);
}

async function promptSdkVersionAsync(
  versions: SdkVersionsSummary,
  templateName: string,
  showAlternatives: boolean,
  projectName: string | undefined
): Promise<number | null> {
  const { latest, expoGoCompatible, available } = versions;

  const choices: prompts.Choice[] = [
    {
      title: `Latest (SDK ${latest})`,
      value: latest,
      description: 'Recommended for most projects',
    },
  ];

  if (expoGoCompatible != null && expoGoCompatible !== latest) {
    choices.push({
      title: `For learning with Expo Go (SDK ${expoGoCompatible})`,
      value: expoGoCompatible,
      description: 'Compatible with Expo Go on App Store and Play Store',
    });
  }

  choices.push({ title: 'Other SDK version…', value: 'other' });

  const { answer } = await prompts({
    type: 'select',
    name: 'answer',
    message: 'Select an Expo SDK version:',
    choices,
  });

  if (answer == null) {
    Log.log();
    Log.log(chalk`Specify the SDK version, example: {cyan --template default@${latest}}`);
    process.exit(1);
  }

  let resolved: number;
  if (answer !== 'other') {
    resolved = answer as number;
  } else {
    const { sdkAnswer } = await prompts({
      type: 'select',
      name: 'sdkAnswer',
      message: 'Select an SDK version:',
      choices: available.slice(0, 4).map((sdk) => ({
        title: `SDK ${sdk}`,
        value: sdk,
      })),
    });

    if (sdkAnswer == null) {
      Log.log();
      Log.log(chalk`Specify the SDK version, example: {cyan --template default@${latest}}`);
      process.exit(1);
    }
    resolved = sdkAnswer as number;
  }

  const friendly = templateName.replace(/^expo-template-/, '');
  const subject = projectName ? chalk.cyan(projectName) : 'a project';
  console.log(chalk`Creating ${subject} using the {cyan ${friendly}} template.`);
  if (showAlternatives) {
    const cmd = formatSelfCommand();
    console.log();
    console.log(chalk.gray('Tip:'));
    console.log(
      `  ${chalk.gray('•')} ${chalk.gray(cmd)} ${chalk.cyan('--template')}  ${chalk.gray('to pick from other templates')}`
    );
    console.log(
      `  ${chalk.gray('•')} ${chalk.gray(cmd)} ${chalk.cyan('--example')}   ${chalk.gray('to explore')} ${chalk.gray.underline('https://github.com/expo/examples')}`
    );
  }
  console.log();

  return resolved;
}
