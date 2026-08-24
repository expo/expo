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

/** The whole answer of `config:effective`, minus the follow-ups the command attaches. */
export interface EffectiveConfigReport {
  projectRoot: string;
  /**
   * The `sdkVersion` the **evaluated app config** resolves to, e.g. `57.0.0`.
   *
   * Deliberately not called `sdkVersion`: `exagent status` reports a field of that name, and it is
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
  autolinkedModules: string[];
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
