// @ref llp/0004-smart-start-and-project-state.rfc.md — the project's own state, read rather than
// guessed. `expo config --type introspect --json` does the whole evaluation (it runs the prebuild
// config and compiles every introspective mod); this module only reshapes what it printed.
//
// Pure on purpose: everything here is a function of one parsed config object plus the static
// `plugins` array, so the reshaping, the plugin join and the honest-gaps list are unit-testable
// without spawning anything.

import { PROGRAM_PREFIX } from '../programName';
import { CommandError } from '../utils/errors';
import type {
  ConfigPlatform,
  ConfigPlatformFilter,
  EffectiveConfigReport,
  EffectivePlugin,
  PlatformMods,
} from './types';

/** The platforms introspection compiles mods for, in the order the report prints them. */
export const CONFIG_PLATFORMS: ConfigPlatform[] = ['ios', 'android'];

/**
 * Mods `--file` can print, and the platform each belongs to.
 *
 * A closed list rather than "whatever the payload happens to hold": the flag names a *file* an
 * agent is looking for, so an unknown name has to be answered with the ones that exist instead of
 * with an empty result that reads like "that file is empty".
 *
 * `splashScreenStoryboard` is deliberately absent — it is an Interface Builder document tree, not
 * a file of settings, and nothing useful is read out of it one key at a time.
 */
export const MOD_FILES: { [mod: string]: ConfigPlatform } = {
  infoPlist: 'ios',
  entitlements: 'ios',
  expoPlist: 'ios',
  podfileProperties: 'ios',
  manifest: 'android',
  gradleProperties: 'android',
  strings: 'android',
  colors: 'android',
  colorsNight: 'android',
  styles: 'android',
};

/**
 * What introspection never answers, whatever the project is.
 *
 * `withIntrospectionBaseMods` drops every non-introspective mod, which is `ios.xcodeproj` and the
 * whole dangerous family [observed — `packages/@expo/config-plugins/src/plugins/mod-compiler.ts`].
 * Naming them is the point: an agent that does not see an `xcodeproj` key must not conclude that
 * no plugin touched the Xcode project.
 */
export const NOT_ATTRIBUTABLE: string[] = ['ios.xcodeproj', '*.dangerous'];

/**
 * What the autolinked list covers, printed next to it on every channel.
 *
 * The list is Expo-module autolinking only, which is a defensible scope and was an undocumented
 * one: `@expo/agent-cli install` classified `@react-native-async-storage/async-storage` as a native module
 * and `inspect:config-plugins` then left it out, so two commands of one CLI disagreed about one package
 * with nothing on screen to reconcile them [observed — friction run 3, F35]. The field name says
 * the scope now; this says what to run for the packages outside it.
 */
export const EXPO_AUTOLINKED_NOTE =
  'Expo modules only — packages that ship an expo-module.config.json. ' +
  'React Native community modules autolink separately and never appear here; ' +
  `run "${PROGRAM_PREFIX} install <package> --json" and read its impact entry for those.`;

/** The `_internal` block of an introspected config, as far as this module reads it. */
interface IntrospectedInternal {
  modResults?: { [platform: string]: PlatformMods };
  pluginHistory?: { [name: string]: { name?: string; version?: string } };
  autolinkedModules?: string[];
}

/** The parsed `expo config --type introspect --json` object. Only the read keys are typed. */
export interface IntrospectedConfig {
  sdkVersion?: string;
  _internal?: IntrospectedInternal;
  [key: string]: unknown;
}

export interface BuildEffectiveConfigOptions {
  projectRoot: string;
  config: IntrospectedConfig;
  /** Plugin ids of the static app config, from `readStaticAppConfigAsync`. */
  declaredPluginIds: string[];
  /** The argv of the subprocess that produced {@link config}, for `source.command`. */
  command: string[];
  durationMs: number;
  /** Platforms to keep. `all` keeps every platform introspection produced. */
  platform: ConfigPlatformFilter;
  /** Keep only this mod, from {@link MOD_FILES}. Null keeps every mod. */
  file: string | null;
}

/**
 * Reshape one introspected config into the report `inspect:config-plugins` prints.
 *
 * @throws {CommandError} `CONFIG_INTROSPECT_UNSUPPORTED` when the payload carries no
 * `_internal.modResults`, which is the one thing this command exists to read.
 */
export function buildEffectiveConfig(options: BuildEffectiveConfigOptions): EffectiveConfigReport {
  const internal = options.config._internal ?? {};
  const modResults = internal.modResults;
  if (modResults == null || typeof modResults !== 'object') {
    throw missingModResultsError();
  }

  return {
    projectRoot: options.projectRoot,
    // Named for what it is — the SDK the *config* names — because `status` already reports the
    // version of the installed `expo` package under `sdkVersion`. See `EffectiveConfigReport`.
    configuredSdkVersion:
      typeof options.config.sdkVersion === 'string' ? options.config.sdkVersion : null,
    source: { command: options.command, durationMs: options.durationMs },
    platforms: selectPlatforms(modResults, options.platform, options.file),
    plugins: joinPlugins(internal.pluginHistory, options.declaredPluginIds),
    declaredNotApplied: declaredNotApplied(internal.pluginHistory, options.declaredPluginIds),
    expoAutolinkedModules: Array.isArray(internal.autolinkedModules)
      ? [...internal.autolinkedModules].sort()
      : [],
    expoAutolinkedModulesNote: EXPO_AUTOLINKED_NOTE,
    notAttributable: NOT_ATTRIBUTABLE,
  };
}

/**
 * The error for a payload without `_internal.modResults`.
 *
 * `_internal` is not a public API — it is documented output of `--type introspect` [observed —
 * `docs/pages/config-plugins/development-and-debugging.mdx`], not a contract — so the shape has to
 * be checked rather than assumed, and the check has to say what to do about it.
 */
function missingModResultsError(): CommandError {
  const error = new CommandError(
    'CONFIG_INTROSPECT_UNSUPPORTED',
    [
      `The Expo CLI answered, but its config carries no introspected native results, so there is no effective configuration to report.`,
      `Why: this command reads "_internal.modResults" out of "expo config --type introspect --json", which the CLI fills by compiling the config plugins. A CLI older than SDK 50 does not produce it, and a run that failed before the plugins compiled does not either.`,
      `How: run "npx expo config --type introspect --json" in this project to see what the CLI printed, and upgrade the project's expo package if the "_internal" block is missing there too.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx expo config --type introspect --json';
  return error;
}

/** Keep the platforms and the mod the caller asked for, dropping platforms left with nothing. */
function selectPlatforms(
  modResults: { [platform: string]: PlatformMods },
  platform: ConfigPlatformFilter,
  file: string | null
): { [platform: string]: PlatformMods } {
  const wanted = platform === 'all' ? CONFIG_PLATFORMS : [platform];
  const selected: { [platform: string]: PlatformMods } = {};

  for (const name of wanted) {
    const mods = modResults[name];
    if (mods == null || typeof mods !== 'object') {
      continue;
    }
    const kept = file == null ? { ...mods } : pickMod(mods, file);
    if (Object.keys(kept).length) {
      selected[name] = kept;
    }
  }
  return selected;
}

/** The one mod `--file` named, or nothing when this platform does not have it. */
function pickMod(mods: PlatformMods, file: string): PlatformMods {
  return file in mods ? { [file]: mods[file] } : {};
}

/**
 * Join `pluginHistory` with the `plugins` array of the app config.
 *
 * The join is the whole value of the list: `pluginHistory` says a plugin *ran*, and only the app
 * config says whether the project *asked* for it. A plugin in the history and not in the array is
 * auto-applied from an installed package, which is why an agent looking for it in `app.json` finds
 * nothing.
 *
 * The list is `pluginHistory`, so it is what *ran and recorded itself*. A declared plugin that
 * never appears there is in no entry at all [observed — `expo-build-properties` and
 * `expo-brownfield` in the recorded SDK 57 fixture], which is the honest limit of this list: it
 * answers "which plugins produced this", not "which plugins the config names".
 *
 * @param declaredPluginIds Plugin ids exactly as the config spells them, e.g. `expo-camera` or
 *   `./plugins/withThing`. A declared id is matched against the plugin name and against its last
 *   path segment, because a local plugin is declared by path and recorded by name.
 */
function joinPlugins(
  pluginHistory: IntrospectedInternal['pluginHistory'],
  declaredPluginIds: string[]
): EffectivePlugin[] {
  if (pluginHistory == null || typeof pluginHistory !== 'object') {
    return [];
  }

  const declared = declaredNames(declaredPluginIds);

  return Object.entries(pluginHistory)
    .map(([key, entry]) => {
      const name = typeof entry?.name === 'string' && entry.name ? entry.name : key;
      return {
        name,
        version: typeof entry?.version === 'string' ? entry.version : null,
        declared: declared.has(name) || declared.has(key),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Plugin ids the app config names that {@link joinPlugins}'s list cannot account for.
 *
 * The gap §joinPlugins documents, said where the reader is (F132). `Plugins 10 (1 declared, 9
 * auto)` for a config that declares three is not wrong — one declared plugin *did* record itself —
 * and it is unreadable, because the two the count leaves out are exactly the ones the caller wrote
 * down and is looking for. Naming them puts this in the same class as {@link NOT_ATTRIBUTABLE},
 * which the report has always printed: what this command cannot see is part of its answer.
 *
 * A plugin here has not necessarily done nothing. `expo-router` modified the Info.plist of the
 * scaffold this was found on and is still absent from the history [observed — 2026-08-28], so the
 * honest reading is narrower than "it did not run": the history did not record it, and this command
 * has nothing else to go on.
 */
function declaredNotApplied(
  pluginHistory: IntrospectedInternal['pluginHistory'],
  declaredPluginIds: string[]
): string[] {
  if (pluginHistory == null || typeof pluginHistory !== 'object') {
    // Nothing was recorded at all, which the `plugins` list already reports as empty. Repeating
    // every declared id here would restate the app config rather than name a gap.
    return [];
  }

  const applied = new Set<string>();
  for (const [key, entry] of Object.entries(pluginHistory)) {
    applied.add(key);
    if (typeof entry?.name === 'string' && entry.name) {
      applied.add(entry.name);
    }
  }

  return declaredPluginIds
    .filter((id) => {
      const names = declaredNames([id]);
      return ![...names].some((name) => applied.has(name));
    })
    .sort((a, b) => a.localeCompare(b));
}

/**
 * The names one declared id may be recorded under: the id itself and its last path segment,
 * because a local plugin is declared by path (`./plugins/withThing`) and recorded by name.
 */
function declaredNames(declaredPluginIds: string[]): Set<string> {
  const names = new Set<string>();
  for (const id of declaredPluginIds) {
    names.add(id);
    names.add(id.split('/').pop() ?? id);
  }
  return names;
}

/**
 * Reject a `--file` value that names no mod.
 *
 * @throws {CommandError} `BAD_ARGS` naming every mod the flag accepts.
 */
export function resolveModFile(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  const file = String(value);
  if (file in MOD_FILES) {
    return file;
  }
  throw new CommandError(
    'BAD_ARGS',
    `--file ${file} names no native file this command can print. The files introspection produces are ${Object.keys(MOD_FILES).join(', ')}. Run the command without --file to see which of them this project has.`
  );
}

/**
 * Read the `--platform` flag.
 *
 * @throws {CommandError} `BAD_ARGS` for anything but `ios`, `android` and `all`.
 */
export function resolvePlatformFilter(value: unknown): ConfigPlatformFilter {
  if (value == null) {
    return 'all';
  }
  const platform = String(value);
  if (platform === 'all' || platform === 'ios' || platform === 'android') {
    return platform;
  }
  throw new CommandError(
    'BAD_ARGS',
    `--platform ${platform} is not a platform this command introspects. Pass ios, android, or all (the default).`
  );
}

/**
 * Reject a `--file`/`--platform` pair that can only ever be empty.
 *
 * Answered here rather than with an empty report: `--platform ios --file manifest` is a mistake,
 * and a report with no platforms reads like "this project has no Android manifest".
 *
 * @throws {CommandError} `BAD_ARGS` naming the platform the file belongs to.
 */
export function assertFilePlatform(file: string | null, platform: ConfigPlatformFilter): void {
  if (file == null || platform === 'all') {
    return;
  }
  const owner = MOD_FILES[file]!;
  if (owner !== platform) {
    throw new CommandError(
      'BAD_ARGS',
      `--file ${file} is an ${owner} file, so --platform ${platform} would leave nothing to print. Pass --platform ${owner}, or drop --platform to introspect both.`
    );
  }
}
