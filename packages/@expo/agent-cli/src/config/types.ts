// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — the `--json` keys mirror the
// text labels, and they are the stable half of the contract.
//
// The effective native configuration of a project: what the config plugins actually produced for
// each platform, which plugins produced it, and what introspection could not answer.

import type { FollowUp } from '../followups/types';

/** The platforms `expo config --type introspect` compiles mods for. */
export type ConfigPlatform = 'ios' | 'android';

/** Which platforms one invocation asked for. */
export type ConfigPlatformFilter = ConfigPlatform | 'all';

/** One config plugin that ran, and whether the app config asked for it. */
export interface EffectivePlugin {
  /** Plugin name as `pluginHistory` records it, e.g. `expo-splash-screen`. */
  name: string;
  /** Version the plugin reported, `UNVERSIONED` for a plugin that ships no version. */
  version: string | null;
  /**
   * The `plugins` array of the app config names this plugin.
   *
   * A plugin that ran without being declared is auto-applied from an installed package
   * [observed — `packages/@expo/prebuild-config/src/plugins/withDefaultPlugins.ts`], which is the
   * difference an agent needs before it edits `app.json` looking for the cause.
   */
  declared: boolean;
}

/** The mods of one platform, as `expo config` compiled them, e.g. `{ infoPlist: {...} }`. */
export type PlatformMods = { [mod: string]: unknown };

/** The whole answer of `inspect:config-plugins`, minus the follow-ups the command attaches. */
export interface EffectiveConfigReport {
  projectRoot: string;
  /**
   * The `sdkVersion` the **evaluated app config** resolves to, e.g. `57.0.0`.
   *
   * Deliberately not called `sdkVersion`: `@expo/agent-cli status` reports a field of that name, and it is
   * the version of the **installed `expo` package** — `57.0.15` where this reads `57.0.0`. Both are
   * right and they answer different questions, so they cannot share one name. This is the SDK line
   * the config targets and the plugins compiled against; `status.project.sdkVersion` is the code
   * that is actually on disk. A project whose `expo` package has drifted from the SDK its config
   * names shows the difference here.
   */
  configuredSdkVersion: string | null;
  /** How the answer was obtained, so a reader can run the same command by hand. */
  source: {
    /** The argv of the subprocess, without the resolved executable path. */
    command: string[];
    durationMs: number;
  };
  /** One entry per platform asked for, dropped when introspection produced nothing for it. */
  platforms: { [platform: string]: PlatformMods };
  plugins: EffectivePlugin[];
  /**
   * Plugin ids the app config declares that {@link plugins} does not account for.
   *
   * {@link plugins} is `_internal.pluginHistory`, which is what *recorded itself*, and a declared
   * plugin missing from it appears in no entry at all — so `1 declared` for a config that declares
   * three used to be the only sign that two were unaccounted for (F132). Same class as
   * {@link notAttributable}: what the command cannot see is part of the answer.
   *
   * Not a claim that these plugins did nothing. One of them modified the Info.plist of the project
   * this was measured on; what is true is that the history does not name them.
   */
  declaredNotApplied: string[];
  /**
   * Packages **Expo-module autolinking** links, e.g. `expo-camera`.
   *
   * Named for its scope, because the scope is the whole trap. The list comes from
   * `_internal.autolinkedModules`, which the prebuild config fills from the Expo autolinking
   * resolver, so it holds packages that ship an `expo-module.config.json` and nothing else. A React
   * Native community module with an `ios/`, an `android/` and a podspec — the shape
   * `@expo/agent-cli install` classifies as `native-module` — is linked by React Native's own autolinking
   * and never appears here [observed — friction run 3, F35: `@react-native-async-storage/
   * async-storage` was classified `native-module` by one command and absent from this list in the
   * next]. Under the old name `autolinkedModules`, an agent asking "is my native dependency
   * linked?" was told no by a list that had never been asked the question.
   */
  expoAutolinkedModules: string[];
  /** One sentence stating that scope, so the `--json` reader is told it too. */
  expoAutolinkedModulesNote: string;
  /**
   * Mods introspection cannot evaluate, so their absence above means "not answered" rather than
   * "nothing changed it" [observed — `packages/@expo/config-plugins/src/plugins/mod-compiler.ts`
   * drops every non-introspective mod].
   */
  notAttributable: string[];
}

/** What the command prints under `--json`. */
export interface EffectiveConfigPayload extends EffectiveConfigReport {
  followups: FollowUp[];
}
