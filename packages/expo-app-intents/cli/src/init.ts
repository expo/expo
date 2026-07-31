import { getConfig, getConfigFilePaths, modifyConfigAsync } from 'expo/config';
import type { ConfigFilePaths, ExpoConfig, ProjectConfig } from 'expo/config';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import prompts from 'prompts';
import type { PromptObject } from 'prompts';

export const ALL_INIT_EXAMPLES = ['minimal', 'counter', 'restaurant', 'mail'] as const;

export type InitExample = (typeof ALL_INIT_EXAMPLES)[number];

export type InitOptions = {
  projectRoot: string;
  directory: string;
  examples: InitExample[];
  templatesDir: string;
};

export const DEFAULT_DIRECTORY = 'app-intents';
const DEFAULT_EXAMPLES: InitExample[] = ['minimal'];

const EXAMPLE_DESCRIPTIONS: Record<InitExample, string> = {
  minimal: 'Adds only the setup module, with no intents and no shortcut phrases.',
  counter: 'Adds a Siri shortcut that opens the app and dispatches an increaseCounter invocation.',
  restaurant: 'Adds a dish-ordering shortcut backed by a dynamic Dish entity catalog.',
  mail: 'Adds a mail draft example that uses Apple App Intent schema domains, with no shortcut phrases.',
};

const EXAMPLE_TEMPLATE_FILES: Record<InitExample, string[]> = {
  minimal: [],
  counter: ['examples/counter/IncreaseCounterIntent.swift'],
  restaurant: [
    'examples/restaurant/OrderFoodIntent.swift',
    'examples/restaurant/Entities/DishEntity.swift',
    'examples/restaurant/Queries/DishQuery.swift',
  ],
  mail: [
    'examples/mail/CreateDraftIntent.swift',
    'examples/mail/DeleteDraftIntent.swift',
    'examples/mail/Entities/MailDraftEntity.swift',
    'examples/mail/Entities/MailAccountEntity.swift',
    'examples/mail/Queries/MailDraftEntityQuery.swift',
    'examples/mail/Queries/MailAccountEntityQuery.swift',
  ],
};

/**
 * Builds the setup module. It is generated rather than copied because what it wires up depends on
 * the selection: it may only refer to `AppShortcuts` when a provider is actually written.
 */
function renderAppIntentsSetup(options: { hasShortcuts: boolean }): string {
  const body: string[] = ['    Name("AppIntentsSetup")'];
  if (options.hasShortcuts) {
    body.push(`    OnCreate {
      Task {
        await AppIntentDispatcher.shared.setShortcutsRefreshHandler {
          AppShortcuts.updateAppShortcutParameters()
        }
        AppShortcuts.updateAppShortcutParameters()
      }
    }`);
  }

  return `internal import ExpoAppIntents
internal import ExpoModulesCore

/**
 Registered Expo inline module that wires app-target App Intents code to expo-app-intents.
 Do not change the name of this class.
 */
final class AppIntentsSetup: Module {
  public func definition() -> ExpoModulesCore.ModuleDefinition {
${body.join('\n\n')}
  }
}
`;
}

const APP_SHORTCUTS_HEADER = `import AppIntents

/**
 All App Shortcuts for this app. Phrases are compiled into the app and cannot be created
 at runtime. Required parameters that are not in the launch phrase are collected by Siri
 as follow-up questions.

 System rules:
 - Every phrase must include \\(.applicationName) or the phrase is dropped at build time.
 - At most 10 App Shortcuts per app. Apple recommends 2-5.
 */
struct AppShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {`;

const APP_SHORTCUTS_FOOTER = `  }
}
`;

type ShortcutEntry = {
  /** The intent the entry launches. Used to find the entry in an AppShortcuts.swift on disk. */
  intentType: string;
  /** The `AppShortcut` literal, indented for the body of `appShortcuts`. */
  block: string;
};

const SHORTCUT_ENTRIES: Partial<Record<InitExample, ShortcutEntry>> = {
  counter: {
    intentType: 'IncreaseCounterIntent',
    block: `    AppShortcut(
      intent: IncreaseCounterIntent(),
      phrases: [
        "Increase the counter in \\(.applicationName)"
      ],
      shortTitle: "Increase Counter",
      systemImageName: "plus.circle"
    )`,
  },
  restaurant: {
    intentType: 'OrderFoodIntent',
    block: `    AppShortcut(
      intent: OrderFoodIntent(),
      phrases: [
        "Place an order in \\(.applicationName)",
        "Order food in \\(.applicationName)",
        "Order \\(\\.$dish) in \\(.applicationName)",
        "Place an order for \\(\\.$dish) in \\(.applicationName)"
      ],
      shortTitle: "Place an order",
      systemImageName: "fork.knife"
    )`,
  },
};

const PLUGIN_NAME = 'expo-app-intents';
const APP_INTENTS_SETUP_FILE_NAME = 'AppIntentsSetup.swift';

type PluginEntry = string | [string, Record<string, any>];

function createPluginEntry(directory: string): PluginEntry {
  if (directory === DEFAULT_DIRECTORY) {
    return PLUGIN_NAME;
  }
  return [PLUGIN_NAME, { directory }];
}

function getPluginSnippet(directory: string): string {
  return directory === DEFAULT_DIRECTORY
    ? `'${PLUGIN_NAME}'`
    : `['${PLUGIN_NAME}', { directory: '${directory}' }]`;
}

function getManualConfigSnippet(directory: string): string {
  return (
    `  experiments: { inlineModules: { watchedDirectories: ['${directory}'] } },\n` +
    `  plugins: [${getPluginSnippet(directory)}],`
  );
}

function splitExampleValues(values: string[]): string[] {
  return values.flatMap((value) => value.split(',')).map((value) => value.trim());
}

export function resolveExamples(values: readonly string[] | undefined): InitExample[] {
  const normalizedValues = splitExampleValues([...(values ?? [])])
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  if (normalizedValues.length === 0) {
    return DEFAULT_EXAMPLES;
  }

  // Validated before `all` is expanded, so that `--examples all,weather` reports the typo instead of
  // silently scaffolding everything.
  const invalid = normalizedValues.filter(
    (value) => value !== 'all' && !(ALL_INIT_EXAMPLES as readonly string[]).includes(value)
  );
  if (invalid.length > 0) {
    throw new Error(
      `Unknown example(s): ${invalid.join(', ')}. Expected one or more of: ` +
        `${ALL_INIT_EXAMPLES.join(', ')}, all.`
    );
  }

  if (normalizedValues.includes('all')) {
    // Derived from the list of examples so that a new example is part of `all` as soon as it is
    // added. `minimal` is the empty baseline rather than an example, and it is dropped below
    // whenever anything else is selected, so it is left out here too.
    return ALL_INIT_EXAMPLES.filter((example) => example !== 'minimal');
  }

  const selected = [...new Set(normalizedValues)] as InitExample[];
  if (selected.length > 1 && selected.includes('minimal')) {
    return selected.filter((example) => example !== 'minimal');
  }
  return selected;
}

export function getExamplesPrompt(): PromptObject {
  return {
    type: 'multiselect',
    name: 'examples',
    message: 'Which App Intents examples should be included?',
    choices: ALL_INIT_EXAMPLES.map((example) => ({
      title: example,
      value: example,
      selected: example === 'minimal',
      description: EXAMPLE_DESCRIPTIONS[example],
    })),
    hint: '- Space to select. Enter to confirm.',
  };
}

export async function resolveExamplesAsync(
  interactive: boolean,
  values: readonly string[] | undefined
): Promise<InitExample[]> {
  if (values && values.length > 0) {
    return resolveExamples(values);
  }
  if (!interactive) {
    return DEFAULT_EXAMPLES;
  }

  const { examples } = await prompts(getExamplesPrompt(), {
    onCancel: () => process.exit(0),
  });
  return resolveExamples(examples);
}

export function normalizeDirectory(directory: string | undefined): string {
  const normalized = (directory ?? DEFAULT_DIRECTORY).trim().replace(/\\/g, '/');
  if (!normalized) {
    throw new Error('Expected a non-empty directory.');
  }
  if (path.isAbsolute(normalized)) {
    throw new Error('The App Intents directory must be relative to the project root.');
  }

  // `.` segments are dropped rather than rejected: `./app-intents` is inside the project root, and
  // both the config plugin and autolinking resolve watched directories against the app root, so it
  // is a working configuration that `init` has to accept.
  const segments = normalized.split('/').filter((segment) => segment && segment !== '.');
  if (segments.includes('..')) {
    throw new Error('The App Intents directory must stay inside the project root.');
  }
  if (segments.length === 0) {
    throw new Error(
      `Expected a directory inside the project root, but '${normalized}' is the project root ` +
        `itself. Watching the whole project would compile every Swift file in it into the app ` +
        `target. Pass a subdirectory instead, such as \`--dir ${DEFAULT_DIRECTORY}\`.`
    );
  }
  return segments.join('/');
}

/** Top-level directories that `npx expo prebuild` generates and `--clean` deletes first. */
const PREBUILD_MANAGED_DIRECTORIES = ['ios', 'android'];

/**
 * Warns when the intents directory is inside a native project directory. Mirrors the plugin's
 * warning about `app/`: the layout is unusual rather than impossible, so it is not refused.
 */
function warnAboutPrebuildManagedDirectory(directory: string): void {
  // Matched the way the plugin matches `app/`: the directory itself, or anything under it.
  const topLevelDirectory = PREBUILD_MANAGED_DIRECTORIES.find(
    (managedDirectory) =>
      directory === managedDirectory || directory.startsWith(`${managedDirectory}/`)
  );
  if (!topLevelDirectory) {
    return;
  }
  console.warn(
    `The App Intents directory '${directory}' is inside '${topLevelDirectory}/', which ` +
      `\`npx expo prebuild\` owns - and prebuild is the next step of this setup. Prebuild ` +
      `regenerates '${topLevelDirectory}/' from your app config, and \`npx expo prebuild --clean\` ` +
      `deletes it first, so the Swift files scaffolded here can be wiped. Re-run with a directory ` +
      `outside '${topLevelDirectory}/', such as \`--dir ${DEFAULT_DIRECTORY}\`, unless you keep ` +
      `'${topLevelDirectory}/' in version control and never run prebuild.`
  );
}

/**
 * Renders the shortcuts provider, or `null` when no selected example contributes a phrase.
 *
 * There is no such thing as an empty `AppShortcutsProvider`: the App Intents metadata extractor
 * rejects a provider whose `appShortcuts` body has no `AppShortcut` in it with
 * "'AppShortcutsProvider' property 'appShortcuts' requires builder syntax". A project with no
 * phrases must therefore have no provider at all, which the extractor accepts.
 */
function renderAppShortcuts(examples: readonly InitExample[]): string | null {
  const blocks = examples.flatMap((example) => {
    const entry = SHORTCUT_ENTRIES[example];
    return entry ? [entry.block] : [];
  });

  if (blocks.length === 0) {
    return null;
  }

  return `${APP_SHORTCUTS_HEADER}
${blocks.join('\n\n')}
${APP_SHORTCUTS_FOOTER}`;
}

/**
 * Warns about examples that are missing from an `AppShortcuts.swift` this run did not write.
 *
 * `init` never overwrites the provider, so adding an example to an existing setup copies the intent
 * but leaves it out of `appShortcuts`. Phrases are compiled into the app from that array only, so
 * the intent has no phrase and neither Siri nor the Shortcuts app can launch it.
 */
async function warnAboutMissingShortcutEntriesAsync(
  filePath: string,
  directory: string,
  examples: readonly InitExample[]
): Promise<void> {
  const contents = await fs.readFile(filePath, 'utf8');
  const missing = examples.flatMap((example) => {
    const entry = SHORTCUT_ENTRIES[example];
    return entry && !contents.includes(entry.intentType) ? [{ example, entry }] : [];
  });
  if (missing.length === 0) {
    return;
  }

  const names = missing.map(({ example, entry }) => `${example} (${entry.intentType})`).join(', ');
  console.warn(
    `${directory}/AppShortcuts.swift already exists and init never overwrites it, so these examples ` +
      `have no App Shortcut entry: ${names}. Their intents are compiled into the app, but a phrase ` +
      `only exists for intents listed in an AppShortcutsProvider, so nothing can launch them yet. ` +
      `Add the entries to the appShortcuts array in ${directory}/AppShortcuts.swift:\n\n` +
      `${missing.map(({ entry }) => entry.block).join('\n\n')}\n`
  );
}

/**
 * Warns when an `AppIntentsSetup.swift` this run did not write has no refresh wiring, even though
 * the app now has an `AppShortcutsProvider`.
 *
 * `init` never overwrites the setup module, so the content it renders for this run - which does
 * include the `OnCreate` block once a provider exists - is discarded whenever the file is already
 * there. A run that adds the first App Shortcut to a scaffold created without one therefore leaves
 * a provider whose parameterized phrases are never re-trained, and the only trace is a line saying
 * the file was skipped.
 */
async function warnAboutMissingShortcutRefreshAsync(
  filePath: string,
  directory: string
): Promise<void> {
  const contents = await fs.readFile(filePath, 'utf8');
  if (contents.includes('setShortcutsRefreshHandler')) {
    return;
  }

  // Pasting a second `OnCreate` into the module would not compile, so what to add depends on
  // whether the kept module already has one.
  const snippet = contents.includes('OnCreate')
    ? `      Task {
        await AppIntentDispatcher.shared.setShortcutsRefreshHandler {
          AppShortcuts.updateAppShortcutParameters()
        }
        AppShortcuts.updateAppShortcutParameters()
      }`
    : `    OnCreate {
      Task {
        await AppIntentDispatcher.shared.setShortcutsRefreshHandler {
          AppShortcuts.updateAppShortcutParameters()
        }
        AppShortcuts.updateAppShortcutParameters()
      }
    }`;
  const where = contents.includes('OnCreate')
    ? `inside the existing OnCreate block in ${directory}/AppIntentsSetup.swift`
    : `to the definition in ${directory}/AppIntentsSetup.swift`;

  console.warn(
    `${directory}/AppIntentsSetup.swift already exists and init never overwrites it, so it does ` +
      `not register a shortcuts refresh handler - but this app now has an AppShortcutsProvider. ` +
      `Siri resolves the parameters of a shortcut phrase against the values it was last given, so ` +
      `without the handler a phrase like "Order <dish>" keeps offering the dishes from whenever ` +
      `the app was built, however often JavaScript republishes the catalog. Add this ${where}:\n\n` +
      `${snippet}\n`
  );
}

function getTemplateFiles(examples: readonly InitExample[]): string[] {
  const files: string[] = [];
  for (const example of examples) {
    files.push(...EXAMPLE_TEMPLATE_FILES[example]);
  }
  return files;
}

function getDestinationPath(templateFile: string): string {
  return templateFile.replace(/^examples\/[^/]+\//, '');
}

async function writeFileIfMissing(
  filePath: string,
  contents: string,
  written: string[],
  skipped: string[],
  displayPath: string
): Promise<void> {
  if (existsSync(filePath)) {
    skipped.push(displayPath);
    return;
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents);
  written.push(displayPath);
}

/**
 * Reading the config through `@expo/config` runs the static `plugins` array by default. The
 * `expo-app-intents` plugin throws while `experiments.inlineModules` is still missing, which is
 * exactly the state `init` exists to repair, so plugins are never evaluated here. The SDK version
 * is not needed either, and requiring it would break projects that have not installed `expo` yet.
 */
const CONFIG_READ_OPTIONS = { skipPlugins: true, skipSDKVersionRequirement: true } as const;

/**
 * The config file to blame for `error`.
 *
 * A project can have both an `app.json` and an `app.config.js`, so the file Expo failed on is not
 * always the dynamic one. `@expo/config` records the file on JSON read errors, which is the case the
 * two-file project hits; otherwise the dynamic config is the one that ran.
 */
function describeFailedConfigPath(
  projectRoot: string,
  paths: ConfigFilePaths,
  error: unknown
): string {
  const failedPath = (error as { fileName?: unknown })?.fileName;
  const configPath =
    (typeof failedPath === 'string' ? failedPath : undefined) ??
    paths.dynamicConfigPath ??
    paths.staticConfigPath;
  return configPath ? path.relative(projectRoot, configPath) : 'app.json';
}

function readAppConfig(projectRoot: string, directory: string): ProjectConfig {
  const paths = getConfigFilePaths(projectRoot);
  try {
    return getConfig(projectRoot, CONFIG_READ_OPTIONS);
  } catch (error: any) {
    throw new Error(
      `Could not read the Expo app config at ${describeFailedConfigPath(projectRoot, paths, error)}. ` +
        `expo-app-intents init has to add its config plugin and the inline-modules watched ` +
        `directory to that config, and Expo could not evaluate it: ${error.message}\n\n` +
        `Fix the app config and re-run \`npx expo-app-intents init\`, or configure it by hand:\n\n` +
        getManualConfigSnippet(directory)
    );
  }
}

/** The static config, unwrapped from the optional top-level `expo` key. */
function getStaticExpoConfig(rootConfig: ProjectConfig['rootConfig']): Record<string, any> {
  const config: Record<string, any> = rootConfig ?? {};
  return config.expo ?? config;
}

/**
 * The `expo-app-intents` entry in the config's `plugins` array, read from the raw static config.
 *
 * `getConfig` deletes `exp.plugins` whenever plugins are skipped, and they have to be skipped here
 * (see `CONFIG_READ_OPTIONS`), so the static config is the only place an entry can be read from. It
 * is the whole config for a static project, but a dynamic `app.config.js` can add, remove or rewrite
 * plugins afterwards, so for those projects a missing entry proves nothing.
 */
function findPluginEntry(rootConfig: ProjectConfig['rootConfig']): PluginEntry | undefined {
  const plugins = getStaticExpoConfig(rootConfig).plugins;
  if (!Array.isArray(plugins)) {
    return undefined;
  }
  return plugins.find(
    (plugin: unknown) =>
      plugin === PLUGIN_NAME || (Array.isArray(plugin) && plugin[0] === PLUGIN_NAME)
  );
}

/** The directory an existing plugin entry points at. Entries without props use the default. */
function getPluginDirectory(entry: PluginEntry): string {
  if (Array.isArray(entry)) {
    const props = entry[1];
    if (props && typeof props === 'object' && typeof props.directory === 'string') {
      return props.directory;
    }
  }
  return DEFAULT_DIRECTORY;
}

/**
 * The watched directories, read from the evaluated config. Unlike `plugins` these survive plugin
 * skipping, so this is the same list autolinking will scan, whichever file it came from.
 */
function getWatchedDirectories(config: ProjectConfig): string[] {
  return config.exp.experiments?.inlineModules?.watchedDirectories ?? [];
}

/**
 * Returns whether `directory` is `ancestor` itself or a directory nested inside it.
 *
 * Both sides are resolved first, so `'./app-intents'`, `'app-intents/'` and
 * `'app-intents/../app-intents'` all name the same directory. The result is then compared by path
 * segment: string comparison gets this wrong in both directions, because `'app-intents-extra'`
 * shares a prefix with `'app-intents'` without being nested inside it, while `'native/..intents'`
 * is nested inside `'native'` even though its relative path starts with two dots.
 *
 * This mirrors `isSameOrInside` in `plugin/src/withAppIntents.ts`. The plugin and this CLI are
 * separate build targets that cannot import from each other, so the helper is duplicated instead of
 * shared; keep the two in sync.
 */
function isSameOrInside(projectRoot: string, ancestor: string, directory: string): boolean {
  const relativePath = path.relative(
    path.resolve(projectRoot, ancestor),
    path.resolve(projectRoot, directory)
  );

  if (relativePath === '') {
    return true;
  }
  if (path.isAbsolute(relativePath)) {
    return false;
  }
  // Only a whole `..` segment leaves `ancestor`. A segment such as `'..intents'` is an ordinary
  // directory whose name begins with two dots.
  return !relativePath.split(path.sep).includes('..');
}

/**
 * Returns whether inline modules already scan `directory`.
 *
 * `expo-modules-autolinking` resolves every watched entry against the app root and then scans it
 * recursively, so any ancestor of the intents directory is a working configuration.
 */
function isWatchedDirectory(
  projectRoot: string,
  watchedDirectories: string[],
  directory: string
): boolean {
  return watchedDirectories.some((watchedDirectory) =>
    isSameOrInside(projectRoot, watchedDirectory, directory)
  );
}

/** Whether two config entries name the same directory, however each one spells the path. */
function isSameDirectory(projectRoot: string, a: string, b: string): boolean {
  return path.resolve(projectRoot, a) === path.resolve(projectRoot, b);
}

/**
 * The watched entries that make `directory` part of the app target.
 *
 * There can be more than one, and none of them has to be `directory` itself: entries are scanned
 * recursively, so every ancestor of the directory covers it too.
 */
function findWatchedEntriesCovering(
  projectRoot: string,
  watchedDirectories: string[],
  directory: string
): string[] {
  return watchedDirectories.filter((watchedDirectory) =>
    isSameOrInside(projectRoot, watchedDirectory, directory)
  );
}

/** Finds a setup file that autolinking already compiles from somewhere other than `directory`. */
async function findOtherAppIntentsSetupAsync(
  projectRoot: string,
  watchedDirectories: string[],
  directory: string
): Promise<string | null> {
  const requestedSetupPath = path.resolve(projectRoot, directory, APP_INTENTS_SETUP_FILE_NAME);
  const queue = watchedDirectories.map((watchedDirectory) =>
    path.resolve(projectRoot, watchedDirectory)
  );

  while (queue.length > 0) {
    const currentDirectory = queue.shift()!;
    const entries = await fs.readdir(currentDirectory, { withFileTypes: true }).catch(() => null);
    if (!entries) {
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        queue.push(entryPath);
      } else if (
        entry.isFile() &&
        entry.name === APP_INTENTS_SETUP_FILE_NAME &&
        path.resolve(entryPath) !== requestedSetupPath
      ) {
        return path.relative(projectRoot, entryPath);
      }
    }
  }

  return null;
}

/**
 * Refuses to move an existing setup to another directory while the old one is still watched.
 * Repointing the plugin does not remove the old directory from `watchedDirectories`, and both
 * directories keep their copy of the scaffold, which breaks the iOS build.
 */
async function assertDirectoryIsNotAlreadyConfiguredAsync(
  projectRoot: string,
  config: ProjectConfig,
  directory: string
): Promise<void> {
  // A dynamic config can add, remove or rewrite a plugin entry inherited from the static config, so
  // the raw entry is never authoritative when one exists. Inspect the evaluated watched trees
  // instead: an existing setup anywhere other than the requested path is concrete evidence that
  // this run would create a duplicate, while a tree with no other setup is safe to scaffold.
  if (config.dynamicConfigPath) {
    const existingSetup = await findOtherAppIntentsSetupAsync(
      projectRoot,
      getWatchedDirectories(config),
      directory
    );
    if (existingSetup) {
      throw new Error(
        `Could not check which directory expo-app-intents is configured to use because the ` +
          `plugins list is computed in JavaScript in ` +
          `${path.relative(projectRoot, config.dynamicConfigPath)}, but the watched inline-module ` +
          `tree already contains '${existingSetup}'. This run would also create ` +
          `'${path.join(directory, APP_INTENTS_SETUP_FILE_NAME)}', and autolinking would compile ` +
          `both files into the app target, making the iOS build fail with ` +
          `\`error: filename "${APP_INTENTS_SETUP_FILE_NAME}" used twice\`. Point the existing ` +
          `expo-app-intents plugin entry at '${directory}' and move the Swift files there, or ` +
          `re-run init with the directory that contains the existing setup.`
      );
    }
    return;
  }

  const pluginEntry = findPluginEntry(config.rootConfig);
  if (!pluginEntry) {
    return;
  }
  const configuredDirectory = getPluginDirectory(pluginEntry);
  if (isSameDirectory(projectRoot, configuredDirectory, directory)) {
    return;
  }
  const coveringEntries = findWatchedEntriesCovering(
    projectRoot,
    getWatchedDirectories(config),
    configuredDirectory
  );
  if (coveringEntries.length === 0) {
    // The old directory is not compiled into the app target, so nothing can collide.
    return;
  }

  // The entries are named because the old directory can be covered by an ancestor instead of by an
  // entry of its own: `'.'` covers 'siri' without 'siri' appearing anywhere in the list, so telling
  // the user to remove 'siri' from it would send them looking for something that is not there.
  const isSingleEntry = coveringEntries.length === 1;
  const entryList = coveringEntries.map((entry) => `'${entry}'`).join(', ');

  throw new Error(
    `expo-app-intents is already configured to use the '${configuredDirectory}' directory, and ` +
      `this run would point it at '${directory}' instead. Only init can decide to move the ` +
      `plugin; it cannot decide whether '${configuredDirectory}' still holds Swift files you ` +
      `need, so it would stay in experiments.inlineModules.watchedDirectories. Both directories ` +
      `would then hold an AppIntentsSetup.swift, autolinking compiles every watched directory ` +
      `into the app target, and the iOS build fails with ` +
      `\`error: filename "AppIntentsSetup.swift" used twice\`.\n\n` +
      `Run \`npx expo-app-intents init --dir ${configuredDirectory}\` to keep the current ` +
      `layout. To move to '${directory}', move the Swift files there yourself, then stop ` +
      `autolinking from scanning '${configuredDirectory}': it is covered by ` +
      `${isSingleEntry ? 'the entry' : 'the entries'} ${entryList} in ` +
      `experiments.inlineModules.watchedDirectories, so delete ` +
      `${isSingleEntry ? 'that entry' : 'those entries'} or narrow ` +
      `${isSingleEntry ? 'it' : 'them'} to a directory that does not contain ` +
      `'${configuredDirectory}'. Then re-run this command.`
  );
}

/**
 * The smallest set of edits that adds `directory` to the config. Only the missing pieces are
 * included: `@expo/config` deep-merges modifications and concatenates arrays, so passing a
 * `watchedDirectories` entry that is already there would duplicate it.
 */
function getConfigModifications(
  projectRoot: string,
  config: ProjectConfig,
  directory: string
): Partial<ExpoConfig> {
  const modifications: Partial<ExpoConfig> = {};

  if (!isWatchedDirectory(projectRoot, getWatchedDirectories(config), directory)) {
    modifications.experiments = { inlineModules: { watchedDirectories: [directory] } };
  }

  const pluginEntry = findPluginEntry(config.rootConfig);
  if (!pluginEntry) {
    modifications.plugins = [createPluginEntry(directory)];
  } else if (!isSameDirectory(projectRoot, getPluginDirectory(pluginEntry), directory)) {
    // Props are required here even for the default directory, otherwise the existing entry keeps
    // pointing at the directory it was configured with.
    modifications.plugins = [[PLUGIN_NAME, { directory }]];
  }

  return modifications;
}

/**
 * Scaffolds App Intents support into an Expo app:
 * 1. copies starter Swift files without overwriting user-owned files,
 * 2. enables `experiments.inlineModules` for the intents directory in the app config,
 * 3. adds the `expo-app-intents` config plugin.
 *
 * The app config is read up front so that a misconfigured project fails before anything is
 * written, but it is only committed once every Swift file is on disk. The scaffold is never
 * overwritten, so a re-run cannot repair a half-written directory on its own; leaving the config
 * untouched is what lets the user fix the cause and run `init` again.
 */
export async function runInit(options: InitOptions): Promise<void> {
  const { projectRoot, directory, examples, templatesDir } = options;

  const config = readAppConfig(projectRoot, directory);
  await assertDirectoryIsNotAlreadyConfiguredAsync(projectRoot, config, directory);
  const modifications = getConfigModifications(projectRoot, config, directory);
  warnAboutPrebuildManagedDirectory(directory);

  const intentsDir = path.join(projectRoot, directory);
  await fs.mkdir(intentsDir, { recursive: true });

  const written: string[] = [];
  const skipped: string[] = [];

  const appShortcutsPath = path.join(intentsDir, 'AppShortcuts.swift');
  const keptExistingAppShortcuts = existsSync(appShortcutsPath);

  const appShortcuts = renderAppShortcuts(examples);
  if (appShortcuts) {
    await writeFileIfMissing(
      appShortcutsPath,
      appShortcuts,
      written,
      skipped,
      'AppShortcuts.swift'
    );
  }

  const appIntentsSetupPath = path.join(intentsDir, 'AppIntentsSetup.swift');
  const keptExistingAppIntentsSetup = existsSync(appIntentsSetupPath);
  const hasShortcuts = appShortcuts !== null || keptExistingAppShortcuts;

  await writeFileIfMissing(
    appIntentsSetupPath,
    // A provider kept from an earlier run counts too: the setup module has to refresh it even when
    // this run's selection contributes no phrase and writes none.
    renderAppIntentsSetup({ hasShortcuts }),
    written,
    skipped,
    'AppIntentsSetup.swift'
  );

  for (const templateFile of getTemplateFiles(examples)) {
    const destinationPath = getDestinationPath(templateFile);
    const destination = path.join(intentsDir, destinationPath);
    if (existsSync(destination)) {
      skipped.push(destinationPath);
      continue;
    }
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(path.join(templatesDir, templateFile), destination);
    written.push(destinationPath);
  }

  let updatedAppConfig = true;
  if (Object.keys(modifications).length > 0) {
    const result = await modifyConfigAsync(projectRoot, modifications, CONFIG_READ_OPTIONS);
    updatedAppConfig = result.type === 'success';
    if (!updatedAppConfig) {
      console.warn(
        `Could not update the Expo app config automatically. ${result.message}. ` +
          `The Swift files are scaffolded, but a config that is computed in JavaScript can only ` +
          `be edited by you. Add this to your config:\n\n` +
          getManualConfigSnippet(directory)
      );
    }
  }

  // Only the edits that were actually part of the modifications are reported. A re-run of an
  // already configured project changes nothing, and claiming otherwise hides what init did.
  if (updatedAppConfig) {
    if (modifications.experiments) {
      console.log(`Enabled inline modules for '${directory}' in the app config`);
    }
    if (modifications.plugins) {
      console.log(
        findPluginEntry(config.rootConfig)
          ? `Pointed '${PLUGIN_NAME}' at '${directory}' in plugins`
          : `Added '${PLUGIN_NAME}' to plugins`
      );
    }
  }
  console.log(`Selected examples: ${examples.join(', ')}`);
  if (written.length) {
    console.log(`Created ${directory}/: ${written.join(', ')}`);
  }
  if (skipped.length) {
    console.log(`Skipped existing files: ${skipped.join(', ')}`);
  }
  if (keptExistingAppShortcuts) {
    await warnAboutMissingShortcutEntriesAsync(appShortcutsPath, directory, examples);
  }
  if (keptExistingAppIntentsSetup && hasShortcuts) {
    await warnAboutMissingShortcutRefreshAsync(appIntentsSetupPath, directory);
  }
  console.log(`\nNext steps:\n  1. npx expo prebuild -p ios\n  2. npx expo run:ios`);
}
