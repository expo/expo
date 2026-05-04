import chalk from 'chalk';
import prompts from 'prompts';

import { ALIASES } from './legacyTemplates';
import { Log } from './log';
import { env } from './utils/env';
import { splitNpmNameAndTag } from './utils/npm';

const debug = require('debug')('expo:init:sdk') as typeof console.log;

/**
 * The Expo versions endpoint is the source of truth for SDK selection:
 * - `sdkVersions` entries with a `releaseNoteUrl` are considered released
 *   (anything without one is canary/in-development).
 * - The top-level `expoGoSdkVersion` field reports which SDK is currently
 *   shipping in the App Store / Play Store version of Expo Go. We treat that
 *   field as optional so older API responses just hide the "For beginners"
 *   choice instead of breaking the prompt.
 */
const VERSIONS_URL = 'https://exp.host/--/api/v2/versions';

type VersionsResponse = {
  expoGoSdkVersion?: string;
  sdkVersions?: Record<string, { releaseNoteUrl?: string; isDeprecated?: boolean; beta?: boolean }>;
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
    .filter(([, info]) => !!info.releaseNoteUrl && !info.isDeprecated && !info.beta)
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
  { yes }: { yes: boolean }
): Promise<string> {
  if (yes || env.CI || env.EXPO_BETA) {
    return template;
  }

  const [name, tag] = splitNpmNameAndTag(template);
  if (tag) {
    return template;
  }
  if (!isKnownExpoTemplate(name)) {
    return template;
  }

  const versions = await fetchSdkVersionsAsync();
  if (!versions) {
    return template;
  }

  const selectedSdk = await promptSdkVersionAsync(versions);
  if (selectedSdk == null) {
    return template;
  }

  return `${name}@sdk-${selectedSdk}`;
}

function isKnownExpoTemplate(name: string): boolean {
  if (ALIASES.includes(name)) {
    return true;
  }
  // Short aliases like `default` and `blank` are expanded to `expo-template-*` later.
  return ALIASES.includes(`expo-template-${name}`);
}

async function promptSdkVersionAsync(versions: SdkVersionsSummary): Promise<number | null> {
  const { latest, expoGoCompatible, available } = versions;

  const choices: prompts.Choice[] = [
    {
      title: `Latest (SDK ${latest})`,
      value: latest,
      description: 'recommended for most projects',
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
    message: 'Choose an Expo SDK version:',
    choices,
  });

  if (answer == null) {
    Log.log();
    Log.log(chalk`Specify the SDK version, example: {cyan --template default@${latest}}`);
    process.exit(1);
  }

  if (answer !== 'other') {
    return answer as number;
  }

  const { sdkAnswer } = await prompts({
    type: 'select',
    name: 'sdkAnswer',
    message: 'Choose an SDK version:',
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

  return sdkAnswer as number;
}
