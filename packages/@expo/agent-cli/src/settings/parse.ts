// @ref llp/0015-backend-selection-and-config.rfc.md §Validation
// The whole of the config's validation, as one pure function over the parsed JSON value. No file
// is read here, so every rejection is unit-testable without a project.

import { PROGRAM_NAME, PROGRAM_PREFIX } from '../programName';
import { CommandError } from '../utils/errors';
import {
  EMPTY_SETTINGS,
  type BuildBackend,
  type AgentCliSettings,
  type PlatformSettings,
  type RunTarget,
} from './types';

/** The keys the config has, in the order the error lists them. */
const KEYS = ['target', 'buildBackend', 'ios', 'android'] as const;

/** The keys a platform object has. */
const PLATFORM_KEYS = ['buildBackend'] as const;

const TARGETS: RunTarget[] = ['expo-go', 'dev-build'];
const BACKENDS: BuildBackend[] = ['local', 'eas'];

/** What one line of the config means, for the `how` half of a rejection. */
const KEY_HELP: Record<string, string> = {
  target: `"expo-go" or "dev-build" — which app the project runs in, when both would work.`,
  buildBackend: `"local" or "eas" — where a native build runs, on this machine or in the cloud.`,
  ios: `{ "buildBackend": … } — the same choice for iOS only, overriding buildBackend.`,
  android: `{ "buildBackend": … } — the same choice for Android only, overriding buildBackend.`,
};

/**
 * Turn the raw value at the config key into settings, or refuse it.
 *
 * **Unknown keys are an error, not a warning** [decided — llp/0015 §Validation]. Every key here
 * exists to change what a build does; a key that was meant to change it and silently did not is a
 * wrong plan approved as a right one, which is the one failure this whole feature exists to
 * prevent. The cost is real and is paid on purpose: a project that names a key a newer `@expo/agent-cli`
 * added cannot be read by an older one, and the error says exactly that and which keys this
 * version knows.
 *
 * @param raw The value found at {@link where}, `undefined` when the key is absent.
 * @param where How to name the location in an error, e.g. `"expo.agentCli" in package.json`.
 * @throws {CommandError} `BAD_AGENT_CLI_CONFIG` with what / why / how.
 */
export function parseAgentCliSettings(raw: unknown, where: string): AgentCliSettings {
  if (raw == null) {
    return EMPTY_SETTINGS;
  }
  if (!isPlainObject(raw)) {
    throw reject(
      `${where} is ${describe(raw)}, and it has to be an object.`,
      `Why: it holds named preferences — ${KEYS.join(', ')} — and only an object can name them.`,
      `How: write it as an object, for example { "buildBackend": "eas" }, or remove the key to let this CLI decide for itself.`
    );
  }

  assertKnownKeys(raw, KEYS, where);

  return {
    target: readEnum(raw, 'target', TARGETS, where),
    buildBackend: readEnum(raw, 'buildBackend', BACKENDS, where),
    ios: readPlatform(raw, 'ios', where),
    android: readPlatform(raw, 'android', where),
  };
}

/** The backend configured for one platform: the platform's own answer, else the shared one. */
export function settingsBuildBackend(
  settings: AgentCliSettings,
  platform: 'ios' | 'android'
): BuildBackend | null {
  return settings[platform]?.buildBackend ?? settings.buildBackend;
}

/** Whether anything at all was configured, for a surface that only speaks up when something was. */
export function settingsAreEmpty(settings: AgentCliSettings): boolean {
  return (
    settings.target == null &&
    settings.buildBackend == null &&
    settings.ios?.buildBackend == null &&
    settings.android?.buildBackend == null
  );
}

function readPlatform(
  raw: Record<string, unknown>,
  key: 'ios' | 'android',
  where: string
): PlatformSettings | null {
  const value = raw[key];
  if (value == null) {
    return null;
  }
  const at = `${where} › ${key}`;
  if (!isPlainObject(value)) {
    throw reject(
      `${at} is ${describe(value)}, and it has to be an object.`,
      `Why: a platform entry holds that platform's own settings, and today it holds exactly one — buildBackend.`,
      `How: write it as { "${key}": { "buildBackend": "eas" } }, or set "buildBackend" at the top level to choose for both platforms at once.`
    );
  }
  assertKnownKeys(value, PLATFORM_KEYS, at);
  return { buildBackend: readEnum(value, 'buildBackend', BACKENDS, at) };
}

function readEnum<T extends string>(
  raw: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  where: string
): T | null {
  const value = raw[key];
  if (value == null) {
    return null;
  }
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw reject(
      `${where} › ${key} is ${describe(value)}, and the only values it takes are ${quoteList(allowed)}.`,
      `Why: ${KEY_HELP[key] ?? 'it names one of a fixed set of choices'}`,
      `How: change it to one of ${quoteList(allowed)}, or remove the key to let this CLI decide for itself — "${PROGRAM_PREFIX} dev --plan" prints what it decides and why.`
    );
  }
  return value as T;
}

function assertKnownKeys(
  raw: Record<string, unknown>,
  allowed: readonly string[],
  where: string
): void {
  const unknown = Object.keys(raw).filter((key) => !allowed.includes(key));
  if (!unknown.length) {
    return;
  }
  const near = unknown
    .map((key) => ({ key, match: closestKey(key, allowed) }))
    .filter((entry) => entry.match);
  throw reject(
    `${where} names ${unknown.length > 1 ? 'keys' : 'a key'} this version of ${PROGRAM_NAME} does not know: ${quoteList(unknown)}.`,
    `Why: every key of this config changes what a plan does, so an unrecognised one is refused rather than ignored — a preference that was silently dropped would leave you approving a plan you did not ask for.`,
    near.length
      ? `How: ${near.map((entry) => `"${entry.key}" looks like "${entry.match}"`).join(', ')}. The keys this version takes are ${quoteList(allowed)}.`
      : `How: remove ${unknown.length > 1 ? 'them' : 'it'}, or upgrade ${PROGRAM_NAME} if a newer version added ${unknown.length > 1 ? 'them' : 'it'}. The keys this version takes are ${quoteList(allowed)}.`
  );
}

/** The allowed key one character-set away from a typo, or null when nothing is close. */
function closestKey(key: string, allowed: readonly string[]): string | null {
  const normalized = key.toLowerCase().replace(/[-_]/g, '');
  return allowed.find((candidate) => candidate.toLowerCase() === normalized) ?? null;
}

/**
 * One rejection, in the three sentences every error of this CLI is made of.
 *
 * No `suggestedCommand`: the fix is an edit to a file this message already names, and every
 * command that reads the config stops in the same place until that edit is made — suggesting one
 * would be suggesting the command that just failed.
 */
function reject(what: string, why: string, how: string): CommandError {
  return new CommandError('BAD_AGENT_CLI_CONFIG', [what, why, how].join('\n'));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** What a value is, in a phrase that fits "… is <this>, and it has to be …". */
function describe(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'an array';
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'object') {
    return 'an object';
  }
  return `${String(value)} (a ${typeof value})`;
}

function quoteList(values: readonly string[]): string {
  return values.map((value) => `"${value}"`).join(', ');
}
