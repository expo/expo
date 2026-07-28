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
  /**
   * Adds Spotlight indexing, a `Transferable` export, and an open intent on top of the mail
   * example, and swaps in a setup module that registers the entity kind so
   * `appEntityIdentifier()` works from JavaScript.
   */
  visualIntelligence?: boolean;
};

export const DEFAULT_DIRECTORY = 'app-intents';
const DEFAULT_EXAMPLES: InitExample[] = ['minimal'];

const EXAMPLE_DESCRIPTIONS: Record<InitExample, string> = {
  minimal: 'Adds only the setup module and an empty AppShortcuts provider.',
  counter: 'Adds a Siri shortcut that opens the app and dispatches an increaseCounter invocation.',
  restaurant: 'Adds a dish-ordering shortcut backed by a dynamic Dish entity catalog.',
  mail: 'Adds a mail draft example that uses Apple App Intent schema domains, with no shortcut phrases.',
};

const EXAMPLE_TEMPLATE_FILES: Record<Exclude<InitExample, 'minimal'>, string[]> = {
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

/** The example that `--visual-intelligence` extends. */
export const VISUAL_INTELLIGENCE_EXAMPLE: InitExample = 'mail';

const VISUAL_INTELLIGENCE_DESCRIPTION =
  'Allows Siri to more intelligently read the on-screen contents of your app.';

/**
 * Added on top of the mail example by `--visual-intelligence`. These are all extensions of the
 * base types, so the mail example itself is unchanged whether or not the flag is used.
 */
const VISUAL_INTELLIGENCE_TEMPLATE_FILES = [
  'examples/mail-visual-intelligence/OpenMailDraftIntent.swift',
  'examples/mail-visual-intelligence/Entities/MailDraftEntity+Spotlight.swift',
  'examples/mail-visual-intelligence/Entities/MailDraftEntity+Transferable.swift',
  'examples/mail-visual-intelligence/Queries/MailDraftEntityQuery+Indexed.swift',
];

/**
 * The setup module has to register the entity kind and expose the Spotlight bridge, so
 * `--visual-intelligence` scaffolds its own variant instead of the shared one.
 */
const SETUP_TEMPLATE_FILE = 'common/AppIntentsSetup.swift';
const VISUAL_INTELLIGENCE_SETUP_TEMPLATE_FILE =
  'examples/mail-visual-intelligence/AppIntentsSetup.swift';

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

const SHORTCUT_BLOCKS: Partial<Record<InitExample, string>> = {
  counter: `    AppShortcut(
      intent: IncreaseCounterIntent(),
      phrases: [
        "Increase the counter in \\(.applicationName)"
      ],
      shortTitle: "Increase Counter",
      systemImageName: "plus.circle"
    )`,
  restaurant: `    AppShortcut(
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
};

function createPluginEntry(directory: string): string | [string, { directory: string }] {
  if (directory === DEFAULT_DIRECTORY) {
    return 'expo-app-intents';
  }
  return ['expo-app-intents', { directory }];
}

function getPluginSnippet(directory: string): string {
  return directory === DEFAULT_DIRECTORY
    ? "'expo-app-intents'"
    : `['expo-app-intents', { directory: '${directory}' }]`;
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
  if (normalizedValues.includes('all')) {
    return ['counter', 'restaurant', 'mail'];
  }

  const invalid = normalizedValues.filter(
    (value) => !(ALL_INIT_EXAMPLES as readonly string[]).includes(value)
  );
  if (invalid.length > 0) {
    throw new Error(
      `Unknown example(s): ${invalid.join(', ')}. Expected one or more of: ` +
        `${ALL_INIT_EXAMPLES.join(', ')}, all.`
    );
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

/**
 * Asked only after the example it extends has been selected, which is why it is a follow-up prompt
 * rather than an entry in the picker: a `prompts` multiselect cannot enable a choice in response to
 * another choice being selected.
 */
export function getVisualIntelligencePrompt(): PromptObject {
  return {
    type: 'confirm',
    name: 'visualIntelligence',
    message: `Add visual intelligence support? ${VISUAL_INTELLIGENCE_DESCRIPTION}`,
    initial: false,
  };
}

export type ResolvedExamples = {
  examples: InitExample[];
  visualIntelligence: boolean;
};

export async function resolveExamplesAsync(
  interactive: boolean,
  values: readonly string[] | undefined,
  visualIntelligence: boolean = false
): Promise<ResolvedExamples> {
  if (values && values.length > 0) {
    return { examples: resolveExamples(values), visualIntelligence };
  }
  if (!interactive) {
    return { examples: DEFAULT_EXAMPLES, visualIntelligence };
  }

  const { examples } = await prompts(getExamplesPrompt(), {
    onCancel: () => process.exit(0),
  });
  const selected = resolveExamples(examples);

  if (visualIntelligence || !selected.includes(VISUAL_INTELLIGENCE_EXAMPLE)) {
    return { examples: selected, visualIntelligence };
  }

  const answer = await prompts(getVisualIntelligencePrompt(), {
    onCancel: () => process.exit(0),
  });
  return { examples: selected, visualIntelligence: answer.visualIntelligence === true };
}

export function normalizeDirectory(directory: string | undefined): string {
  const normalized = (directory ?? DEFAULT_DIRECTORY).trim().replace(/\\/g, '/');
  if (!normalized) {
    throw new Error('Expected a non-empty directory.');
  }
  if (path.isAbsolute(normalized)) {
    throw new Error('The App Intents directory must be relative to the project root.');
  }

  const segments = normalized.split('/').filter(Boolean);
  if (segments.length === 0 || segments.includes('.') || segments.includes('..')) {
    throw new Error('The App Intents directory must stay inside the project root.');
  }
  return segments.join('/');
}

function renderAppShortcuts(examples: readonly InitExample[]): string {
  const blocks = examples.flatMap((example) => {
    const block = SHORTCUT_BLOCKS[example];
    return block ? [block] : [];
  });

  if (blocks.length === 0) {
    // `appShortcuts` is a result builder, so an empty provider needs an empty body. Returning a
    // literal `[]` does not compile.
    return `${APP_SHORTCUTS_HEADER}
    // Add an AppShortcut here to give an intent a spoken launch phrase. Intents that conform to
    // an Apple schema domain are discovered without one.
${APP_SHORTCUTS_FOOTER}`;
  }

  return `${APP_SHORTCUTS_HEADER}
${blocks.join('\n\n')}
${APP_SHORTCUTS_FOOTER}`;
}

/**
 * Throws when `--visual-intelligence` was requested without the example it extends, rather than
 * scaffolding the flag away silently.
 */
export function assertVisualIntelligenceSelection(
  examples: readonly InitExample[],
  visualIntelligence: boolean
): void {
  if (visualIntelligence && !examples.includes(VISUAL_INTELLIGENCE_EXAMPLE)) {
    throw new Error(
      `--visual-intelligence extends the ${VISUAL_INTELLIGENCE_EXAMPLE} example with Spotlight ` +
        `indexing and on-screen entity support, but that example was not selected. Run again with ` +
        `--examples ${VISUAL_INTELLIGENCE_EXAMPLE} --visual-intelligence, or drop the flag.`
    );
  }
}

function getTemplateFiles(examples: readonly InitExample[], visualIntelligence: boolean): string[] {
  const files = [
    visualIntelligence ? VISUAL_INTELLIGENCE_SETUP_TEMPLATE_FILE : SETUP_TEMPLATE_FILE,
  ];
  for (const example of examples) {
    if (example === 'minimal') {
      continue;
    }
    files.push(...EXAMPLE_TEMPLATE_FILES[example]);
  }
  if (visualIntelligence) {
    files.push(...VISUAL_INTELLIGENCE_TEMPLATE_FILES);
  }
  return files;
}

function getDestinationPath(templateFile: string): string {
  return templateFile.replace(/^common\//, '').replace(/^examples\/[^/]+\//, '');
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
 * Scaffolds App Intents support into an Expo app:
 * 1. enables `experiments.inlineModules` for the intents directory in app.json,
 * 2. adds the `expo-app-intents` config plugin,
 * 3. copies starter Swift files without overwriting user-owned files.
 */
export async function runInit(options: InitOptions): Promise<void> {
  const { projectRoot, directory, examples, templatesDir } = options;
  const visualIntelligence = options.visualIntelligence ?? false;
  assertVisualIntelligenceSelection(examples, visualIntelligence);

  const appJsonPath = path.join(projectRoot, 'app.json');
  const canUpdateAppJson = existsSync(appJsonPath);
  if (canUpdateAppJson) {
    const appJson = JSON.parse(await fs.readFile(appJsonPath, 'utf8'));
    if (!appJson.expo) {
      appJson.expo = {};
    }
    const expo = appJson.expo;

    if (!expo.experiments) {
      expo.experiments = {};
    }
    const experiments = expo.experiments;

    if (!experiments.inlineModules) {
      experiments.inlineModules = { watchedDirectories: [] };
    }
    const inlineModules = experiments.inlineModules;

    if (!inlineModules.watchedDirectories) {
      inlineModules.watchedDirectories = [];
    }
    if (!inlineModules.watchedDirectories.includes(directory)) {
      inlineModules.watchedDirectories.push(directory);
    }

    if (!expo.plugins) {
      expo.plugins = [];
    }
    const plugins = expo.plugins;
    const pluginIndex = plugins.findIndex(
      (plugin: unknown) =>
        plugin === 'expo-app-intents' || (Array.isArray(plugin) && plugin[0] === 'expo-app-intents')
    );
    if (pluginIndex === -1) {
      plugins.push(createPluginEntry(directory));
    } else {
      const plugin = plugins[pluginIndex];
      if (plugin === 'expo-app-intents') {
        plugins[pluginIndex] = createPluginEntry(directory);
      } else if (Array.isArray(plugin)) {
        const props =
          plugin[1] && typeof plugin[1] === 'object' && !Array.isArray(plugin[1]) ? plugin[1] : {};
        const nextProps = { ...props, directory };
        plugins[pluginIndex] =
          directory === DEFAULT_DIRECTORY && Object.keys(props).length === 0
            ? 'expo-app-intents'
            : ['expo-app-intents', nextProps];
      }
    }

    await fs.writeFile(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
  } else {
    console.warn(
      `Could not find app.json in ${projectRoot}. expo-app-intents init will scaffold Swift ` +
        `files, but cannot update dynamic configs automatically. Add this to app.config.js/ts:\n\n` +
        `  experiments: { inlineModules: { watchedDirectories: ['${directory}'] } },\n` +
        `  plugins: [${getPluginSnippet(directory)}],`
    );
  }

  const intentsDir = path.join(projectRoot, directory);
  await fs.mkdir(intentsDir, { recursive: true });

  const written: string[] = [];
  const skipped: string[] = [];

  await writeFileIfMissing(
    path.join(intentsDir, 'AppShortcuts.swift'),
    renderAppShortcuts(examples),
    written,
    skipped,
    'AppShortcuts.swift'
  );

  for (const templateFile of getTemplateFiles(examples, visualIntelligence)) {
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

  if (canUpdateAppJson) {
    console.log(`Enabled inline modules for '${directory}' in app.json`);
    console.log("Added 'expo-app-intents' to plugins");
  }
  console.log(
    `Selected examples: ${examples.join(', ')}${visualIntelligence ? ' (+ visual intelligence)' : ''}`
  );
  if (written.length) {
    console.log(`Created ${directory}/: ${written.join(', ')}`);
  }
  if (skipped.length) {
    console.log(`Skipped existing files: ${skipped.join(', ')}`);
  }
  console.log(`\nNext steps:\n  1. npx expo prebuild -p ios\n  2. npx expo run:ios`);
}
