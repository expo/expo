// @ref llp/0011-impact-and-freshness.rfc.md §A fingerprint change is not "OTA-unsafe"
// Whether an update published now would reach builds that can run it.
//
// This is the one part of `impact` that must not be derived from the class. A fingerprint answers
// "does the native binary differ"; OTA safety is a `runtimeVersion` question, and the two coincide
// under exactly one policy. Under `appVersion`, `sdkVersion` or a literal string, adding a native
// module leaves the runtimeVersion where it was — so an update published now reaches installed
// builds that cannot run it, and the app crashes on a module that is not there.

import path from 'path';

import { readStaticAppConfigAsync } from '../project/appConfig';
import { readJsonFileAsync } from '../project/nodeModules';
import { spawnExpoAsync } from '../utils/expoCli';
import type { OtaSafety, RuntimeVersionInfo } from './types';

/** The policies `runtimeVersion` accepts as `{ "policy": "..." }` [observed — expo config schema]. */
const KNOWN_POLICIES = ['fingerprint', 'appVersion', 'sdkVersion', 'nativeVersion'];

/**
 * Resolve the project's `runtimeVersion`, preferring the config the app itself would see.
 *
 * `expo config --json --type public` evaluates a dynamic `app.config.js` with its environment,
 * which is the only way to learn the runtimeVersion of a project whose config is code. This closes
 * the follow-up llp/0004 §Implemented in v1 as, item 7 recorded: config was read from static files
 * only, so a dynamic config yielded no answer at all.
 *
 * Falls back to the static config when the subprocess fails, and reports `source: null` when
 * neither answered — which is not "no runtimeVersion", and is never read as one.
 */
export async function resolveRuntimeVersionAsync(projectRoot: string): Promise<RuntimeVersionInfo> {
  const fromCli = await readFromExpoConfigAsync(projectRoot);
  if (fromCli) {
    return fromCli;
  }
  return readFromStaticConfigAsync(projectRoot);
}

async function readFromExpoConfigAsync(projectRoot: string): Promise<RuntimeVersionInfo | null> {
  let result;
  try {
    ({ result } = await spawnExpoAsync(projectRoot, ['config', '--json', '--type', 'public'], {
      output: 'capture',
    }));
  } catch {
    // `resolveExpoCli` never throws for a missing bin — it falls back to `npx` — so this only
    // fires on something unexpected, and an unexpected failure here is still just "no answer".
    return null;
  }
  if (result.exitCode !== 0 || result.spawnError) {
    return null;
  }

  const config = parseLastJsonObject(result.stdout);
  if (!config) {
    return null;
  }
  return readRuntimeVersion(config.runtimeVersion, 'expo config --type public');
}

async function readFromStaticConfigAsync(projectRoot: string): Promise<RuntimeVersionInfo> {
  const staticConfig = await readStaticAppConfigAsync(projectRoot);
  if (!staticConfig.source) {
    return { policy: null, literal: null, source: null };
  }

  const contents = await readJsonFileAsync<Record<string, any>>(
    path.join(projectRoot, staticConfig.source)
  );
  const config = (contents?.expo ?? contents ?? {}) as { runtimeVersion?: unknown };
  return readRuntimeVersion(config.runtimeVersion, staticConfig.source);
}

/**
 * Read one `runtimeVersion` value, in either spelling.
 *
 * A string is a literal, and `{ policy: "..." }` is a policy. A policy this CLI has never heard of
 * is reported under `policy` verbatim rather than dropped: a new policy is a thing that exists,
 * and the safety verdict for it is `null`, not `false`.
 */
export function readRuntimeVersion(value: unknown, source: string): RuntimeVersionInfo {
  if (typeof value === 'string' && value) {
    return { policy: null, literal: value, source };
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const policy = (value as { policy?: unknown }).policy;
    if (typeof policy === 'string' && policy) {
      return { policy, literal: null, source };
    }
  }
  // The config was read and named no runtimeVersion. That is a real answer — the project has no
  // runtime version configured — and it is reported with the source that said so.
  return { policy: null, literal: null, source };
}

/**
 * Whether an update published now is safe, from the policy and nothing else.
 *
 * The four answers, and why each is what it is:
 *
 * - **`fingerprint`** — the runtimeVersion *is* the fingerprint, so a native change moves it and
 *   the update is served only to builds made from the new fingerprint. Safe either way: unchanged
 *   means the installed builds match, changed means they will not be offered it.
 * - **Every other policy, with the fingerprint changed** — `appVersion`, `sdkVersion`,
 *   `nativeVersion` and a literal all keep the same runtimeVersion across a native change, so the
 *   update reaches builds that lack the new native code. Not safe.
 * - **Every other policy, with the fingerprint unchanged** — the native surface is the same, so
 *   the installed builds can run the new bundle. Safe.
 * - **Nothing resolved** — `null`. A report that cannot see the policy has not established that
 *   an update is safe, and saying `false` would be as much of an invention as saying `true`.
 *
 * @param fingerprintChanged the strongest answer across the platforms asked about; `null` when it
 *   could not be decided, which makes the verdict `null` for every policy but `fingerprint`.
 */
export function resolveOtaSafety(
  runtimeVersion: RuntimeVersionInfo,
  fingerprintChanged: boolean | null
): OtaSafety {
  const { policy, literal, source } = runtimeVersion;

  if (policy === 'fingerprint') {
    return {
      safe: true,
      runtimeVersion,
      why: `The runtimeVersion policy is "fingerprint", so the runtime version moves with the native surface: an update published now is only offered to builds made from the same fingerprint. EAS Update will not serve it to a build that cannot run it.`,
    };
  }

  if (!source || (policy == null && literal == null)) {
    return {
      safe: null,
      runtimeVersion,
      why: source
        ? `${source} names no runtimeVersion, so which builds an update would reach cannot be decided here. Configure runtimeVersion before publishing an update, or check the channel on expo.dev.`
        : `The runtimeVersion could not be resolved — neither "expo config --type public" nor a static app config answered — so whether an update published now is safe is unknown. It is not reported as safe on a guess.`,
    };
  }

  const name = policy ? `"${policy}"` : `the literal "${literal}"`;
  const unknownPolicy = policy != null && !KNOWN_POLICIES.includes(policy);

  if (fingerprintChanged == null) {
    return {
      safe: null,
      runtimeVersion,
      why: `The runtimeVersion policy is ${name}, which does not track the native surface, and whether the native surface changed could not be decided — so whether an update published now would reach builds that cannot run it is unknown.`,
    };
  }

  if (unknownPolicy) {
    return {
      safe: null,
      runtimeVersion,
      why: `The runtimeVersion policy is ${name}, which this CLI does not know. Whether it tracks the native surface decides the answer, so nothing is claimed about it.`,
    };
  }

  if (fingerprintChanged) {
    return {
      safe: false,
      runtimeVersion,
      why: `The native surface changed, but the runtimeVersion policy is ${name}, which does not move with it. An update published now would keep the same runtime version and reach installed builds that do not have the new native code, where it would crash. Ship a new build first, or switch the policy to "fingerprint".`,
    };
  }

  return {
    safe: true,
    runtimeVersion,
    why: `The native surface is unchanged, so the installed builds can run this bundle. The runtimeVersion policy is ${name}, which is unaffected either way.`,
  };
}

/**
 * The config object on stdout.
 *
 * **The last JSON line wins**, the same rule `parseFingerprint` uses, and for the same reason: the
 * Expo CLI writes its own structured event lines to stdout ahead of the answer, so slicing from the
 * first `{` reads an event and then fails on the rest of the stream. Only if no single line parses
 * is the whole tail tried, which is what reads a pretty-printed payload spanning many lines.
 */
export function parseLastJsonObject(output: string): Record<string, any> | null {
  const lines = output.split('\n').reverse();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) {
      continue;
    }
    const parsed = parseObject(trimmed);
    // An event line parses too, and it has no `runtimeVersion` — but neither does a config that
    // names none, so the two cannot be told apart here. The *last* line is the answer either way:
    // the CLI prints the payload last, which is the property this depends on and the stub
    // reproduces deliberately.
    if (parsed) {
      return parsed;
    }
  }

  const start = output.indexOf('{');
  return start < 0 ? null : parseObject(output.slice(start));
}

function parseObject(value: string): Record<string, any> | null {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
