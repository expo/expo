// @ref llp/0015-backend-selection-and-config.rfc.md §Where the config lives
// What a developer may tell this CLI about their own preferences, as pure data.
//
// Named `settings` rather than `config` because `src/config/` is already taken by
// `@expo/agent-cli inspect:config-plugins`, which reports the **app** config — the thing `app.json` holds and
// the config plugins compile. This is the opposite kind of file: a preference about how this
// machine's developer wants their app run and built, which never reaches the app.

/** Which app the project runs in during development. */
export type RunTarget =
  /** Expo Go, when it can run the project at all. */
  | 'expo-go'
  /** A development build, even where Expo Go would do. */
  | 'dev-build';

/** Where a native build runs. The same two words as `RunsOn`, said as a preference. */
export type BuildBackend = 'local' | 'eas';

/** Every key of the config, all optional, `null` for "the developer said nothing". */
export interface AgentCliSettings {
  /**
   * Which app the plan engine should aim for.
   *
   * `dev-build` is the one that changes a plan that would otherwise work: a project Expo Go can
   * run is planned as a development build instead, which is the whole reason this key exists.
   * `expo-go` is the default behaviour written down, and it cannot make an incompatible project
   * compatible — the plan says so rather than pretending.
   */
  target: RunTarget | null;
  /** Where every native build runs, unless a platform below overrides it. */
  buildBackend: BuildBackend | null;
  /** Per-platform overrides of {@link buildBackend}, `null` when the file names none. */
  ios: PlatformSettings | null;
  android: PlatformSettings | null;
}

/** What may be said about one platform. */
export interface PlatformSettings {
  buildBackend: BuildBackend | null;
}

/** An `AgentCliSettings` that says nothing, which is what every project without the key has. */
export const EMPTY_SETTINGS: AgentCliSettings = {
  target: null,
  buildBackend: null,
  ios: null,
  android: null,
};

/** The config as it was found, so every surface can say where a preference came from. */
export interface LoadedSettings {
  settings: AgentCliSettings;
  /**
   * The file the config was read from, or `null` when no project file named one.
   *
   * Absolute, so an error can be opened. A project with no `@expo/agent-cli` key loads
   * {@link EMPTY_SETTINGS} from `null`, which is not an error: saying nothing is the default.
   */
  file: string | null;
  /** Where in that file, e.g. `expo.agentCli`, for an error that has to name the key. */
  keyPath: string | null;
}

/** Nothing configured, from nowhere. */
export const NO_SETTINGS: LoadedSettings = { settings: EMPTY_SETTINGS, file: null, keyPath: null };
