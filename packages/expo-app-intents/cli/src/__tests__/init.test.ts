import fs from 'fs';
import os from 'os';
import path from 'path';
import prompts from 'prompts';

import {
  getExamplesPrompt,
  getVisualIntelligencePrompt,
  type InitExample,
  normalizeDirectory,
  resolveExamples,
  resolveExamplesAsync,
  runInit,
} from '../init';

jest.mock('prompts');

const mockedPrompts = jest.mocked(prompts);

const TEMPLATES = {
  'examples/counter/IncreaseCounterIntent.swift': 'counter',
  'examples/restaurant/OrderFoodIntent.swift': 'restaurant intent',
  'examples/restaurant/Entities/DishEntity.swift': 'dish entity',
  'examples/restaurant/Queries/DishQuery.swift': 'dish query',
  'examples/mail/CreateDraftIntent.swift': 'mail create intent',
  'examples/mail/DeleteDraftIntent.swift': 'mail delete intent',
  'examples/mail-visual-intelligence/OpenMailDraftIntent.swift': 'vi open intent',
  'examples/mail-visual-intelligence/Entities/MailDraftEntity+Spotlight.swift': 'vi spotlight',
  'examples/mail-visual-intelligence/Entities/MailDraftEntity+Transferable.swift':
    'vi transferable',
  'examples/mail-visual-intelligence/Queries/MailDraftEntityQuery+Indexed.swift':
    'vi indexed query',
  'examples/mail/Entities/MailDraftEntity.swift': 'mail draft entity',
  'examples/mail/Entities/MailAccountEntity.swift': 'mail account entity',
  'examples/mail/Queries/MailDraftEntityQuery.swift': 'mail draft query',
  'examples/mail/Queries/MailAccountEntityQuery.swift': 'mail account query',
};

describe(resolveExamples, () => {
  it('defaults to minimal', () => {
    expect(resolveExamples(undefined)).toEqual(['minimal']);
    expect(resolveExamples([])).toEqual(['minimal']);
  });

  it('accepts multiple values and comma-separated values', () => {
    expect(resolveExamples(['counter', 'restaurant,mail'])).toEqual([
      'counter',
      'restaurant',
      'mail',
    ]);
  });

  it('ignores minimal when other examples are selected', () => {
    expect(resolveExamples(['minimal', 'counter'])).toEqual(['counter']);
  });

  it('expands all to every non-minimal example', () => {
    expect(resolveExamples(['all'])).toEqual(['counter', 'restaurant', 'mail']);
  });

  it('throws for an unknown example listed next to all', () => {
    expect(() => resolveExamples(['all,weather'])).toThrow(/Unknown example\(s\): weather/);
  });
});

describe(getExamplesPrompt, () => {
  it('does not offer visual intelligence in the picker itself', () => {
    const choices = getExamplesPrompt().choices as { value: string }[];

    expect(choices.map((choice) => choice.value)).toEqual([
      'minimal',
      'counter',
      'restaurant',
      'mail',
    ]);
  });
});

describe(getVisualIntelligencePrompt, () => {
  it('explains what visual intelligence does and defaults to off', () => {
    const prompt = getVisualIntelligencePrompt();

    expect(prompt.type).toBe('confirm');
    expect(prompt.name).toBe('visualIntelligence');
    expect(prompt.message).toContain(
      'Allows Siri to more intelligently read the on-screen contents of your app.'
    );
    expect(prompt.initial).toBe(false);
  });
});
describe(resolveExamplesAsync, () => {
  beforeEach(() => {
    mockedPrompts.mockReset();
  });

  it('never prompts when examples are passed on the command line', async () => {
    await expect(resolveExamplesAsync(true, ['mail'], true)).resolves.toEqual({
      examples: ['mail'],
      visualIntelligence: true,
    });
    expect(mockedPrompts).not.toHaveBeenCalled();
  });

  it('never prompts when not interactive', async () => {
    await expect(resolveExamplesAsync(false, undefined)).resolves.toEqual({
      examples: ['minimal'],
      visualIntelligence: false,
    });
    expect(mockedPrompts).not.toHaveBeenCalled();
  });

  it('asks for examples with a cancellable multiselect prompt', async () => {
    // `counter` rather than `mail`, so the visual-intelligence follow-up does not run — this test
    // is about the shape of the examples prompt itself.
    mockedPrompts.mockResolvedValueOnce({ examples: ['minimal', 'counter'] });

    await expect(resolveExamplesAsync(true, [])).resolves.toMatchObject({ examples: ['counter'] });
    expect(mockedPrompts).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'examples', type: 'multiselect' }),
      expect.objectContaining({ onCancel: expect.any(Function) })
    );
  });

  it('does not ask about visual intelligence unless the mail example was picked', async () => {
    mockedPrompts.mockResolvedValueOnce({ examples: ['counter'] });

    await expect(resolveExamplesAsync(true, undefined)).resolves.toEqual({
      examples: ['counter'],
      visualIntelligence: false,
    });
    expect(mockedPrompts).toHaveBeenCalledTimes(1);
  });

  it('asks about visual intelligence once the mail example was picked', async () => {
    mockedPrompts
      .mockResolvedValueOnce({ examples: ['counter', 'mail'] })
      .mockResolvedValueOnce({ visualIntelligence: true });

    await expect(resolveExamplesAsync(true, undefined)).resolves.toEqual({
      examples: ['counter', 'mail'],
      visualIntelligence: true,
    });
    expect(mockedPrompts).toHaveBeenCalledTimes(2);
    expect(mockedPrompts.mock.calls[1]![0]).toMatchObject({
      type: 'confirm',
      name: 'visualIntelligence',
    });
  });

  it('respects declining visual intelligence', async () => {
    mockedPrompts
      .mockResolvedValueOnce({ examples: ['mail'] })
      .mockResolvedValueOnce({ visualIntelligence: false });

    await expect(resolveExamplesAsync(true, undefined)).resolves.toEqual({
      examples: ['mail'],
      visualIntelligence: false,
    });
  });

  it('skips the follow-up when the flag was already passed', async () => {
    mockedPrompts.mockResolvedValueOnce({ examples: ['mail'] });

    await expect(resolveExamplesAsync(true, undefined, true)).resolves.toEqual({
      examples: ['mail'],
      visualIntelligence: true,
    });
    expect(mockedPrompts).toHaveBeenCalledTimes(1);
  });
});

describe(normalizeDirectory, () => {
  it('defaults to app-intents', () => {
    expect(normalizeDirectory(undefined)).toBe('app-intents');
  });

  it('normalizes nested relative paths', () => {
    expect(normalizeDirectory('native\\app-intents')).toBe('native/app-intents');
  });

  it('rejects absolute paths and parent traversal', () => {
    expect(() => normalizeDirectory('/tmp/app-intents')).toThrow(/relative/);
    expect(() => normalizeDirectory('../app-intents')).toThrow(/inside/);
  });

  it('rejects the project root as the intents directory', () => {
    expect(() => normalizeDirectory('.')).toThrow(/inside/);
  });

  // Both the config plugin and autolinking resolve the directory against the app root, so an
  // explicitly relative path is a working configuration and must not be rejected.
  it('accepts explicitly relative and trailing-slash paths', () => {
    expect(normalizeDirectory('./app-intents')).toBe('app-intents');
    expect(normalizeDirectory('app-intents/')).toBe('app-intents');
    expect(normalizeDirectory('./native/app-intents')).toBe('native/app-intents');
  });

  // Only a whole `..` segment leaves the project root. A segment that merely begins with two dots is
  // an ordinary directory name, so it is accepted here and has to be compared as a path segment
  // everywhere else.
  it('accepts a directory whose name begins with two dots', () => {
    expect(normalizeDirectory('native/..intents')).toBe('native/..intents');
  });
});

describe(runInit, () => {
  // `runInit` delegates the app config edit to `@expo/config`, which resolves the config file
  // through Node module resolution. That only sees the real file system, so these tests use a
  // temporary project directory instead of an in-memory one.
  let tempRoot: string;
  let projectRoot: string;
  let templatesDir: string;
  let log: jest.SpyInstance;
  let warn: jest.SpyInstance;

  function write(files: Record<string, string>): void {
    for (const [relativePath, contents] of Object.entries(files)) {
      const filePath = path.join(tempRoot, relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, contents);
    }
  }

  function writeTemplates(): void {
    write(
      Object.fromEntries(
        Object.entries(TEMPLATES).map(([name, contents]) => [`templates/${name}`, contents])
      )
    );
  }

  function writeProject(config: string | null, appConfigFileName = 'app.json'): void {
    write({ 'project/package.json': JSON.stringify({ name: 'my-app' }) });
    if (config !== null) {
      write({ [`project/${appConfigFileName}`]: config });
    }
    writeTemplates();
  }

  function staticConfig(expo: Record<string, unknown> = {}): string {
    return JSON.stringify({ expo: { name: 'my-app', slug: 'my-app', ...expo } }, null, 2);
  }

  function readConfig(appConfigFileName = 'app.json'): any {
    return JSON.parse(fs.readFileSync(path.join(projectRoot, appConfigFileName), 'utf8'));
  }

  function exists(relativePath: string): boolean {
    return fs.existsSync(path.join(projectRoot, relativePath));
  }

  function read(relativePath: string): string {
    return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
  }

  function messages(spy: jest.SpyInstance): string {
    return spy.mock.calls.map((call) => call.join(' ')).join('\n');
  }

  beforeEach(() => {
    tempRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'expo-app-intents-init-')));
    projectRoot = path.join(tempRoot, 'project');
    templatesDir = path.join(tempRoot, 'templates');
    fs.mkdirSync(projectRoot, { recursive: true });
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    log.mockRestore();
    warn.mockRestore();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('writes config and scaffolds the default minimal app-intents directory', async () => {
    writeProject(staticConfig());

    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['minimal'],
      templatesDir,
    });

    const appJson = readConfig();
    expect(appJson.expo.experiments.inlineModules.watchedDirectories).toEqual(['app-intents']);
    expect(appJson.expo.plugins).toEqual(['expo-app-intents']);

    // No example contributes a phrase, so no provider is written: the App Intents metadata
    // extractor rejects an `AppShortcutsProvider` that has no `AppShortcut` in it.
    expect(exists('app-intents/AppShortcuts.swift')).toBe(false);
    expect(exists('app-intents/AppIntentsSetup.swift')).toBe(true);
    expect(exists('app-intents/IncreaseCounterIntent.swift')).toBe(false);

    // With no provider the setup module must not refer to one.
    const setup = read('app-intents/AppIntentsSetup.swift');
    expect(setup).toContain('Name("AppIntentsSetup")');
    expect(setup).not.toContain('AppShortcuts');
  });

  it('scaffolds only the selected examples', async () => {
    writeProject(staticConfig());

    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['counter', 'restaurant'],
      templatesDir,
    });

    expect(exists('app-intents/AppShortcuts.swift')).toBe(true);
    expect(exists('app-intents/AppIntentsSetup.swift')).toBe(true);
    expect(exists('app-intents/IncreaseCounterIntent.swift')).toBe(true);
    expect(exists('app-intents/OrderFoodIntent.swift')).toBe(true);
    expect(exists('app-intents/Entities/DishEntity.swift')).toBe(true);
    expect(exists('app-intents/Queries/DishQuery.swift')).toBe(true);
    expect(exists('app-intents/CreateDraftIntent.swift')).toBe(false);

    const shortcuts = read('app-intents/AppShortcuts.swift');
    expect(shortcuts).toContain('IncreaseCounterIntent');
    expect(shortcuts).toContain('OrderFoodIntent');
    expect(shortcuts).not.toContain('CreateDraftIntent');
  });

  it('scaffolds the mail example without adding a shortcut phrase', async () => {
    writeProject(staticConfig());

    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['counter', 'restaurant', 'mail'],
      templatesDir,
    });

    expect(exists('app-intents/CreateDraftIntent.swift')).toBe(true);
    expect(exists('app-intents/DeleteDraftIntent.swift')).toBe(true);
    expect(exists('app-intents/Entities/MailDraftEntity.swift')).toBe(true);
    expect(exists('app-intents/Entities/MailAccountEntity.swift')).toBe(true);
    expect(exists('app-intents/Queries/MailDraftEntityQuery.swift')).toBe(true);
    expect(exists('app-intents/Queries/MailAccountEntityQuery.swift')).toBe(true);

    // The mail schema intents are discovered from App Intents metadata, so the example
    // deliberately contributes no AppShortcut phrase.
    const shortcuts = read('app-intents/AppShortcuts.swift');
    expect(shortcuts).toContain('IncreaseCounterIntent');
    expect(shortcuts).toContain('OrderFoodIntent');
    expect(shortcuts).not.toContain('Draft');
  });

  it('writes no shortcuts provider when no example contributes a phrase', async () => {
    writeProject(staticConfig());

    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['mail'],
      templatesDir,
    });

    expect(exists('app-intents/CreateDraftIntent.swift')).toBe(true);
    expect(exists('app-intents/AppShortcuts.swift')).toBe(false);
  });

  it('adds the visual intelligence layer to the mail example when requested', async () => {
    writeProject(staticConfig());

    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['mail'],
      visualIntelligence: true,
      templatesDir,
    });

    // The base mail example is still scaffolded unchanged.
    expect(exists('app-intents/CreateDraftIntent.swift')).toBe(true);
    expect(exists('app-intents/DeleteDraftIntent.swift')).toBe(true);
    expect(exists('app-intents/Entities/MailDraftEntity.swift')).toBe(true);

    // Plus the additive visual intelligence layer.
    expect(exists('app-intents/OpenMailDraftIntent.swift')).toBe(true);
    expect(exists('app-intents/Entities/MailDraftEntity+Spotlight.swift')).toBe(true);
    expect(exists('app-intents/Entities/MailDraftEntity+Transferable.swift')).toBe(true);
    expect(exists('app-intents/Queries/MailDraftEntityQuery+Indexed.swift')).toBe(true);

    // The generated setup module registers the entity kind and exposes the indexing bridge.
    const setup = read('app-intents/AppIntentsSetup.swift');
    expect(setup).toContain('AppEntityIdentifierRegistry.shared.registerIndexed("mailDraft"');
    // Indexing is driven by setEntityCatalogAsync now, so the scaffold exposes no bridge for it.
    expect(setup).not.toContain('AsyncFunction');
    // mail contributes no phrase, so there is no provider to wire up.
    expect(exists('app-intents/AppShortcuts.swift')).toBe(false);
    expect(setup).not.toContain('AppShortcuts');
  });

  it('scaffolds no visual intelligence files by default', async () => {
    writeProject(staticConfig());

    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['mail'],
      templatesDir,
    });

    expect(exists('app-intents/OpenMailDraftIntent.swift')).toBe(false);
    expect(exists('app-intents/Entities/MailDraftEntity+Spotlight.swift')).toBe(false);
    const plainSetup = read('app-intents/AppIntentsSetup.swift');
    expect(plainSetup).not.toContain('AppEntityIdentifierRegistry');
    expect(plainSetup).not.toContain('registerIndexed');
  });

  it('rejects visual intelligence without the mail example', async () => {
    writeProject(staticConfig());

    await expect(
      runInit({
        projectRoot,
        directory: 'app-intents',
        examples: ['counter'],
        visualIntelligence: true,
        templatesDir,
      })
    ).rejects.toThrow(/--visual-intelligence extends the mail example/);
  });

  it('names the selected examples and both ways to add the missing one', async () => {
    writeProject(staticConfig());

    const error = await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['counter'],
      visualIntelligence: true,
      templatesDir,
    }).catch((caught: Error) => caught);

    const message = (error as Error).message;
    expect(message).toContain('counter');
    // The flag also reaches this check from the interactive picker, where it was already passed on
    // the command line, so the message has to name the picker as a way out as well.
    expect(message).toContain('--examples mail');
    expect(message).toContain('picker');
  });

  it('lists the scaffolded files and points at the guide for receiving invocations', async () => {
    writeProject(staticConfig());

    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['counter'],
      templatesDir,
    });

    const output = messages(log);
    expect(output).toContain('AppIntentsSetup.swift');
    expect(output).toContain('IncreaseCounterIntent.swift');
    // Nothing receives an invocation until the JavaScript side is wired up, so the guide has to be
    // reachable from the output.
    expect(output).toContain('https://docs.expo.dev/versions/latest/sdk/app-intents/#usage');
  });

  it('merges into existing experiments and plugins without duplication', async () => {
    writeProject(
      staticConfig({
        plugins: ['expo-app-intents', ['other-plugin', {}]],
        experiments: {
          inlineModules: { watchedDirectories: ['modules'] },
          typedRoutes: true,
        },
      })
    );

    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['minimal'],
      templatesDir,
    });

    const appJson = readConfig();
    expect(appJson.expo.experiments.inlineModules.watchedDirectories).toEqual([
      'modules',
      'app-intents',
    ]);
    expect(appJson.expo.experiments.typedRoutes).toBe(true);
    expect(
      appJson.expo.plugins.filter((plugin: unknown) => plugin === 'expo-app-intents')
    ).toHaveLength(1);
  });

  it('is idempotent when the config already points at the same directory', async () => {
    writeProject(
      staticConfig({
        plugins: ['expo-app-intents'],
        experiments: { inlineModules: { watchedDirectories: ['app-intents'] } },
      })
    );

    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['minimal'],
      templatesDir,
    });

    const appJson = readConfig();
    expect(appJson.expo.experiments.inlineModules.watchedDirectories).toEqual(['app-intents']);
    expect(appJson.expo.plugins).toEqual(['expo-app-intents']);
  });

  // Autolinking resolves every watched entry against the app root and then scans it recursively, so
  // an ancestor of the intents directory already covers it. Adding the intents directory as a second
  // entry makes autolinking collect the same AppIntentsSetup.swift twice, and the Swift driver fails
  // with `error: filename "AppIntentsSetup.swift" used twice`.
  it('does not add a watched directory that an existing entry already covers', async () => {
    writeProject(staticConfig({ experiments: { inlineModules: { watchedDirectories: ['.'] } } }));

    await runInit({ projectRoot, directory: 'app-intents', examples: ['minimal'], templatesDir });

    expect(readConfig().expo.experiments.inlineModules.watchedDirectories).toEqual(['.']);
  });

  it('does not add a nested watched directory when its parent is watched', async () => {
    writeProject(
      staticConfig({ experiments: { inlineModules: { watchedDirectories: ['native'] } } })
    );

    await runInit({
      projectRoot,
      directory: 'native/app-intents',
      examples: ['minimal'],
      templatesDir,
    });

    expect(readConfig().expo.experiments.inlineModules.watchedDirectories).toEqual(['native']);
  });

  // '..intents' is an ordinary directory whose name begins with two dots, so 'native' already covers
  // it. Comparing the relative path as a string reads that leading '..' as a step out of 'native'
  // and adds a second watched entry, and autolinking then collects AppIntentsSetup.swift twice.
  it('does not add a nested watched directory whose name begins with two dots', async () => {
    writeProject(
      staticConfig({ experiments: { inlineModules: { watchedDirectories: ['native'] } } })
    );

    await runInit({
      projectRoot,
      directory: 'native/..intents',
      examples: ['minimal'],
      templatesDir,
    });

    expect(readConfig().expo.experiments.inlineModules.watchedDirectories).toEqual(['native']);
    expect(exists('native/..intents/AppIntentsSetup.swift')).toBe(true);
  });

  it('refuses to repoint when the old directory is watched under another spelling', async () => {
    writeProject(
      staticConfig({
        plugins: [['expo-app-intents', { directory: 'siri' }]],
        experiments: { inlineModules: { watchedDirectories: ['./siri'] } },
      })
    );

    await expect(
      runInit({ projectRoot, directory: 'app-intents', examples: ['minimal'], templatesDir })
    ).rejects.toThrow(/already configured to use the 'siri' directory/);
    expect(exists('app-intents')).toBe(false);
  });

  it('treats an explicitly relative plugin directory as the requested directory', async () => {
    writeProject(
      staticConfig({
        plugins: [['expo-app-intents', { directory: './app-intents' }]],
        experiments: { inlineModules: { watchedDirectories: ['./app-intents'] } },
      })
    );

    await runInit({ projectRoot, directory: 'app-intents', examples: ['minimal'], templatesDir });

    const appJson = readConfig();
    expect(appJson.expo.plugins).toEqual([['expo-app-intents', { directory: './app-intents' }]]);
    expect(appJson.expo.experiments.inlineModules.watchedDirectories).toEqual(['./app-intents']);
    expect(exists('app-intents/AppIntentsSetup.swift')).toBe(true);
  });

  it.each(['ios', 'android/app-intents'])(
    'warns that prebuild can delete a scaffold in %s',
    async (directory) => {
      writeProject(staticConfig());

      await runInit({ projectRoot, directory, examples: ['minimal'], templatesDir });

      const warned = messages(warn);
      expect(warned).toContain('prebuild');
      expect(warned).toContain(directory);
      expect(exists(`${directory}/AppIntentsSetup.swift`)).toBe(true);
    }
  );

  it('writes plugin props when using a custom directory', async () => {
    writeProject(staticConfig());

    await runInit({
      projectRoot,
      directory: 'siri',
      examples: ['minimal'],
      templatesDir,
    });

    const appJson = readConfig();
    expect(appJson.expo.experiments.inlineModules.watchedDirectories).toEqual(['siri']);
    expect(appJson.expo.plugins).toEqual([['expo-app-intents', { directory: 'siri' }]]);
  });

  it('keeps unrelated plugin props when adding the directory prop', async () => {
    writeProject(staticConfig({ plugins: [['expo-app-intents', { unrelated: true }]] }));

    await runInit({
      projectRoot,
      directory: 'siri',
      examples: ['minimal'],
      templatesDir,
    });

    const appJson = readConfig();
    expect(appJson.expo.plugins).toEqual([
      ['expo-app-intents', { unrelated: true, directory: 'siri' }],
    ]);
  });

  it('refuses to repoint a directory that is still watched', async () => {
    // A project that ran `init --dir siri` before. Repointing the plugin at 'app-intents' while
    // 'siri' stays watched leaves an AppIntentsSetup.swift in both watched directories, and
    // autolinking scans both, so the Swift driver fails with "filename used twice".
    writeProject(
      staticConfig({
        plugins: [['expo-app-intents', { directory: 'siri' }]],
        experiments: { inlineModules: { watchedDirectories: ['siri'] } },
      })
    );
    write({ 'project/siri/AppShortcuts.swift': 'existing shortcuts' });

    await expect(
      runInit({
        projectRoot,
        directory: 'app-intents',
        examples: ['minimal'],
        templatesDir,
      })
    ).rejects.toThrow(/already configured to use the 'siri' directory/);

    // Nothing was changed, so the project still builds and a re-run with --dir siri works.
    const appJson = readConfig();
    expect(appJson.expo.plugins).toEqual([['expo-app-intents', { directory: 'siri' }]]);
    expect(appJson.expo.experiments.inlineModules.watchedDirectories).toEqual(['siri']);
    expect(exists('app-intents')).toBe(false);
  });

  // The old directory is watched through an ancestor, so there is no 'siri' entry to remove. The
  // advice has to name the entry the user will actually find in the list.
  it('names the watched entry that covers the old directory when it refuses to repoint', async () => {
    writeProject(
      staticConfig({
        plugins: [['expo-app-intents', { directory: 'siri' }]],
        experiments: { inlineModules: { watchedDirectories: ['.'] } },
      })
    );

    const error = await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['minimal'],
      templatesDir,
    }).catch((caught: Error) => caught);

    const message = (error as Error).message;
    expect(message).toContain(`'.'`);
    expect(message).not.toContain(`remove 'siri' from`);
  });

  it('repoints the plugin when the old directory is no longer watched', async () => {
    writeProject(
      staticConfig({
        plugins: [['expo-app-intents', { directory: 'siri' }]],
        experiments: { inlineModules: { watchedDirectories: [] } },
      })
    );

    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['minimal'],
      templatesDir,
    });

    const appJson = readConfig();
    expect(appJson.expo.plugins).toEqual([['expo-app-intents', { directory: 'app-intents' }]]);
    expect(appJson.expo.experiments.inlineModules.watchedDirectories).toEqual(['app-intents']);
  });

  it('does not overwrite existing intent files', async () => {
    writeProject(staticConfig());
    // Every file this run would write: the generated provider, the generated setup module, and a
    // copied template. `counter` is selected because it is the example that contributes a phrase,
    // so a provider is rendered and there is something to overwrite.
    write({
      'project/app-intents/AppShortcuts.swift': 'user-owned shortcuts',
      'project/app-intents/AppIntentsSetup.swift': 'user-owned setup',
      'project/app-intents/IncreaseCounterIntent.swift': 'user-owned intent',
    });

    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['counter'],
      templatesDir,
    });

    expect(read('app-intents/AppShortcuts.swift')).toBe('user-owned shortcuts');
    expect(read('app-intents/AppIntentsSetup.swift')).toBe('user-owned setup');
    expect(read('app-intents/IncreaseCounterIntent.swift')).toBe('user-owned intent');
    // The files that were left alone are reported, so a re-run over an existing scaffold does not
    // look like it rewrote them.
    expect(messages(log)).toContain(
      'Skipped existing files: AppShortcuts.swift, AppIntentsSetup.swift, IncreaseCounterIntent.swift'
    );
  });

  // `init` never overwrites AppShortcuts.swift, so a later run that adds an example leaves the new
  // intent out of the provider. Nothing can launch that intent, so the user has to be told.
  it('warns when an added example has no entry in the existing shortcuts provider', async () => {
    writeProject(staticConfig());

    // Seeded with restaurant, which contributes a phrase and so writes the provider. `minimal`
    // writes none, and a run with no provider has nothing to be missing from.
    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['restaurant'],
      templatesDir,
    });
    warn.mockClear();
    await runInit({ projectRoot, directory: 'app-intents', examples: ['counter'], templatesDir });

    const warned = messages(warn);
    expect(warned).toContain('AppShortcuts.swift');
    expect(warned).toContain('IncreaseCounterIntent');
  });

  it('does not warn about the shortcuts provider when it already lists the example', async () => {
    writeProject(staticConfig());

    await runInit({ projectRoot, directory: 'app-intents', examples: ['counter'], templatesDir });
    warn.mockClear();
    await runInit({ projectRoot, directory: 'app-intents', examples: ['counter'], templatesDir });

    expect(messages(warn)).toBe('');
  });

  // `init` never overwrites AppIntentsSetup.swift, so adding --visual-intelligence to an existing
  // setup copies the layer but leaves the entity kind unregistered, which makes the layer inert.
  it('warns when visual intelligence is added to an existing setup module', async () => {
    writeProject(staticConfig());

    await runInit({ projectRoot, directory: 'app-intents', examples: ['mail'], templatesDir });
    warn.mockClear();
    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['mail'],
      visualIntelligence: true,
      templatesDir,
    });

    // The layer itself is still scaffolded, so the warning is the only sign anything is missing.
    expect(exists('app-intents/Entities/MailDraftEntity+Spotlight.swift')).toBe(true);
    expect(read('app-intents/AppIntentsSetup.swift')).not.toContain('registerIndexed');

    const warned = messages(warn);
    expect(warned).toContain('AppIntentsSetup.swift');
    expect(warned).toContain('appEntityIdentifier()');
    expect(warned).toContain(
      'AppEntityIdentifierRegistry.shared.registerIndexed("mailDraft", as: MailDraftEntity.self)'
    );
  });

  // The mail example contributes no phrase, so the setup module it wrote has no `OnCreate` at all
  // and pasting the statement alone would not compile.
  it('includes the OnCreate wrapper when the existing setup module has none', async () => {
    writeProject(staticConfig());

    await runInit({ projectRoot, directory: 'app-intents', examples: ['mail'], templatesDir });
    warn.mockClear();
    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['mail'],
      visualIntelligence: true,
      templatesDir,
    });

    expect(messages(warn)).toContain('OnCreate {');
  });

  // With counter selected there is a provider to refresh, so the existing setup module already has
  // an `OnCreate` and only the statement inside it is missing.
  it('adds the registration to the OnCreate the existing setup module already has', async () => {
    writeProject(staticConfig());

    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['counter', 'mail'],
      templatesDir,
    });
    warn.mockClear();
    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['counter', 'mail'],
      visualIntelligence: true,
      templatesDir,
    });

    const warned = messages(warn);
    expect(warned).toContain('registerIndexed');
    expect(warned).toContain('OnCreate block');
    expect(warned).not.toContain('OnCreate {');
  });

  it('does not warn when the existing setup module already registers the entity kind', async () => {
    writeProject(staticConfig());

    const options = {
      projectRoot,
      directory: 'app-intents',
      examples: ['mail'] as InitExample[],
      visualIntelligence: true,
      templatesDir,
    };
    await runInit(options);
    warn.mockClear();
    await runInit(options);

    expect(messages(warn)).toBe('');
  });

  it('does not warn about the registration when visual intelligence was not requested', async () => {
    writeProject(staticConfig());

    await runInit({ projectRoot, directory: 'app-intents', examples: ['mail'], templatesDir });
    warn.mockClear();
    await runInit({ projectRoot, directory: 'app-intents', examples: ['mail'], templatesDir });

    expect(messages(warn)).toBe('');
  });

  it('leaves the app config untouched when a template cannot be copied', async () => {
    writeProject(staticConfig());
    fs.rmSync(path.join(templatesDir, 'examples/counter/IncreaseCounterIntent.swift'));

    await expect(
      runInit({
        projectRoot,
        directory: 'app-intents',
        examples: ['counter'],
        templatesDir,
      })
    ).rejects.toThrow();

    const appJson = readConfig();
    expect(appJson.expo.plugins).toBeUndefined();
    expect(appJson.expo.experiments).toBeUndefined();
    expect(messages(log)).toBe('');
  });

  it('completes the scaffold on a re-run after a failed copy', async () => {
    writeProject(staticConfig());
    const template = path.join(templatesDir, 'examples/counter/IncreaseCounterIntent.swift');
    fs.rmSync(template);

    await expect(
      runInit({
        projectRoot,
        directory: 'app-intents',
        examples: ['counter'],
        templatesDir,
      })
    ).rejects.toThrow();

    fs.writeFileSync(template, 'counter');
    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['counter'],
      templatesDir,
    });

    expect(exists('app-intents/AppShortcuts.swift')).toBe(true);
    expect(exists('app-intents/AppIntentsSetup.swift')).toBe(true);
    expect(exists('app-intents/IncreaseCounterIntent.swift')).toBe(true);

    const appJson = readConfig();
    expect(appJson.expo.plugins).toEqual(['expo-app-intents']);
    expect(appJson.expo.experiments.inlineModules.watchedDirectories).toEqual(['app-intents']);
  });

  it('reads an app.json that uses JSON5 comments and trailing commas', async () => {
    writeProject(`{
  // Expo reads the app config as JSON5, so this comment is legal.
  "expo": {
    "name": "my-app",
    "slug": "my-app",
  },
}
`);

    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['minimal'],
      templatesDir,
    });

    const appJson = readConfig();
    expect(appJson.expo.experiments.inlineModules.watchedDirectories).toEqual(['app-intents']);
    expect(appJson.expo.plugins).toEqual(['expo-app-intents']);
    // `minimal` contributes no phrase, so the setup module is the file that proves the scaffold ran.
    expect(exists('app-intents/AppIntentsSetup.swift')).toBe(true);
  });

  it('updates app.config.json when that is the static config', async () => {
    writeProject(staticConfig(), 'app.config.json');

    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['minimal'],
      templatesDir,
    });

    const appConfig = readConfig('app.config.json');
    expect(appConfig.expo.experiments.inlineModules.watchedDirectories).toEqual(['app-intents']);
    expect(appConfig.expo.plugins).toEqual(['expo-app-intents']);
    expect(exists('app.json')).toBe(false);
  });

  it('explains what to add by hand when the project uses a dynamic app.config.js', async () => {
    writeProject(null);
    write({
      'project/app.config.js': `module.exports = { expo: { name: 'my-app', slug: 'my-app' } };`,
    });

    await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['minimal'],
      templatesDir,
    });

    expect(exists('app-intents/AppIntentsSetup.swift')).toBe(true);
    const warned = messages(warn);
    expect(warned).toContain('app.config.js');
    expect(warned).toContain("watchedDirectories: ['app-intents']");
    expect(warned).toContain("plugins: ['expo-app-intents']");
  });

  // A dynamic config can point the plugin at a child directory that init cannot see. Because the
  // watched parent recursively covers both locations, adding another setup at the requested parent
  // would make autolinking collect two files with the same name and break the Swift build.
  it('refuses to scaffold a second setup under a dynamically configured watched tree', async () => {
    writeProject(null);
    write({
      'project/app.config.js': `module.exports = { expo: { name: 'my-app', slug: 'my-app', plugins: [['expo-app-intents', { directory: 'app-intents/legacy' }]], experiments: { inlineModules: { watchedDirectories: ['app-intents'] } } } };`,
      'project/app-intents/legacy/AppIntentsSetup.swift': 'existing setup',
    });

    await expect(
      runInit({ projectRoot, directory: 'app-intents', examples: ['minimal'], templatesDir })
    ).rejects.toThrow(/app-intents\/legacy\/AppIntentsSetup\.swift/);

    expect(exists('app-intents/AppIntentsSetup.swift')).toBe(false);
  });

  it('does not trust a static plugin entry when a dynamic config repoints it', async () => {
    writeProject(
      staticConfig({
        plugins: ['expo-app-intents'],
        experiments: { inlineModules: { watchedDirectories: ['legacy'] } },
      })
    );
    write({
      'project/app.config.js': `module.exports = ({ config }) => ({ ...config, plugins: [['expo-app-intents', { directory: 'legacy' }]] });`,
      'project/legacy/AppIntentsSetup.swift': 'existing setup',
    });

    await expect(
      runInit({ projectRoot, directory: 'app-intents', examples: ['minimal'], templatesDir })
    ).rejects.toThrow(/legacy\/AppIntentsSetup\.swift/);

    expect(exists('app-intents/AppIntentsSetup.swift')).toBe(false);
    expect(readConfig().expo.experiments.inlineModules.watchedDirectories).toEqual(['legacy']);
  });

  // A setup at the requested path is the one this run intends to keep, so it is not a conflict even
  // though the dynamic plugin entry itself cannot be inspected.
  it('allows an existing setup at the requested path under a dynamic config', async () => {
    writeProject(null);
    write({
      'project/app.config.js': `module.exports = { expo: { name: 'my-app', slug: 'my-app', experiments: { inlineModules: { watchedDirectories: ['./app-intents'] } } } };`,
      'project/app-intents/AppIntentsSetup.swift': 'existing setup',
    });

    await runInit({ projectRoot, directory: 'app-intents', examples: ['minimal'], templatesDir });

    expect(read('app-intents/AppIntentsSetup.swift')).toBe('existing setup');
  });

  it('explains which file could not be read when the app config is malformed', async () => {
    writeProject('{ "expo": { "name": ');

    await expect(
      runInit({
        projectRoot,
        directory: 'app-intents',
        examples: ['minimal'],
        templatesDir,
      })
    ).rejects.toThrow(/app\.json/);
    await expect(
      runInit({
        projectRoot,
        directory: 'app-intents',
        examples: ['minimal'],
        templatesDir,
      })
    ).rejects.toThrow(/expo-app-intents init/);
  });

  it('names the malformed static config instead of the dynamic one', async () => {
    writeProject('{ "expo": { "name": ');
    write({ 'project/app.config.js': `module.exports = ({ config }) => config;` });

    const error = await runInit({
      projectRoot,
      directory: 'app-intents',
      examples: ['minimal'],
      templatesDir,
    }).catch((caught: Error) => caught);

    expect((error as Error).message).toContain('Could not read the Expo app config at app.json.');
  });
});
