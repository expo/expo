import { vol } from 'memfs';

import { getExamplesPrompt, normalizeDirectory, resolveExamples, runInit } from '../cli/init';

jest.mock('fs', () => require('memfs').fs);
jest.mock('fs/promises', () => require('memfs').fs.promises);

const TEMPLATES = {
  'common/AppIntentsSetup.swift': 'setup',
  'examples/counter/IncreaseCounterIntent.swift': 'counter',
  'examples/restaurant/OrderFoodIntent.swift': 'restaurant intent',
  'examples/restaurant/Entities/DishEntity.swift': 'dish entity',
  'examples/restaurant/Queries/DishQuery.swift': 'dish query',
  'examples/journal/CreateJournalEntryShortcutIntent.swift': 'journal shortcut intent',
  'examples/journal/CreateJournalEntryIntent.swift': 'journal intent',
  'examples/journal/Entities/JournalEntryEntity.swift': 'journal entity',
  'examples/journal/Queries/JournalEntryQuery.swift': 'journal query',
};

function templateFiles(templatesDir: string) {
  return Object.fromEntries(
    Object.entries(TEMPLATES).map(([name, content]) => [`${templatesDir}/${name}`, content])
  );
}

describe(resolveExamples, () => {
  it('defaults to minimal', () => {
    expect(resolveExamples(undefined)).toEqual(['minimal']);
    expect(resolveExamples([])).toEqual(['minimal']);
  });

  it('accepts multiple values and comma-separated values', () => {
    expect(resolveExamples(['counter', 'restaurant,journal'])).toEqual([
      'counter',
      'restaurant',
      'journal',
    ]);
  });

  it('ignores minimal when other examples are selected', () => {
    expect(resolveExamples(['minimal', 'counter'])).toEqual(['counter']);
  });

  it('expands all to every non-minimal example', () => {
    expect(resolveExamples(['all'])).toEqual(['counter', 'restaurant', 'journal']);
  });

  it('throws for unknown examples', () => {
    expect(() => resolveExamples(['weather'])).toThrow(/Unknown example/);
  });
});

describe(getExamplesPrompt, () => {
  it('describes each selectable example in the picker', () => {
    const prompt = getExamplesPrompt();

    expect(prompt.choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: 'minimal',
          description: expect.stringContaining('empty AppShortcuts provider'),
        }),
        expect.objectContaining({
          value: 'counter',
          description: expect.stringContaining('increaseCounter'),
        }),
        expect.objectContaining({
          value: 'restaurant',
          description: expect.stringContaining('Dish entity catalog'),
        }),
        expect.objectContaining({
          value: 'journal',
          description: expect.stringContaining('schema domains'),
        }),
      ])
    );
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
});

describe(runInit, () => {
  beforeEach(() => {
    vol.reset();
  });

  it('writes config and scaffolds the default minimal app-intents directory', async () => {
    const templatesDir = '/pkg/templates';
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'my-app' }),
      '/project/app.json': JSON.stringify({ expo: { name: 'my-app', slug: 'my-app' } }, null, 2),
      ...templateFiles(templatesDir),
    });

    await runInit({
      projectRoot: '/project',
      directory: 'app-intents',
      examples: ['minimal'],
      templatesDir,
    });

    const appJson = JSON.parse(vol.readFileSync('/project/app.json', 'utf8') as string);
    expect(appJson.expo.experiments.inlineModules.watchedDirectories).toEqual(['app-intents']);
    expect(appJson.expo.plugins).toEqual(['expo-app-intents']);

    expect(vol.existsSync('/project/app-intents/AppShortcuts.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/AppIntentsSetup.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/IncreaseCounterIntent.swift')).toBe(false);

    expect(vol.readFileSync('/project/app-intents/AppShortcuts.swift', 'utf8')).toContain('[]');
    expect(vol.readFileSync('/project/app-intents/AppShortcuts.swift', 'utf8')).not.toContain(
      '@available(iOS 16.0, *)'
    );
  });

  it('scaffolds only the selected examples', async () => {
    const templatesDir = '/pkg/templates';
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'my-app' }),
      '/project/app.json': JSON.stringify({ expo: { name: 'my-app', slug: 'my-app' } }, null, 2),
      ...templateFiles(templatesDir),
    });

    await runInit({
      projectRoot: '/project',
      directory: 'app-intents',
      examples: ['counter', 'restaurant'],
      templatesDir,
    });

    expect(vol.existsSync('/project/app-intents/AppShortcuts.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/AppIntentsSetup.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/IncreaseCounterIntent.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/OrderFoodIntent.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/Entities/DishEntity.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/Queries/DishQuery.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/CreateJournalEntryIntent.swift')).toBe(false);

    const shortcuts = vol.readFileSync('/project/app-intents/AppShortcuts.swift', 'utf8') as string;
    expect(shortcuts).toContain('IncreaseCounterIntent');
    expect(shortcuts).toContain('OrderFoodIntent');
    expect(shortcuts).not.toContain('CreateJournalEntryIntent');
  });

  it('adds a journal shortcut when the journal example is selected', async () => {
    const templatesDir = '/pkg/templates';
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'my-app' }),
      '/project/app.json': JSON.stringify({ expo: { name: 'my-app', slug: 'my-app' } }, null, 2),
      ...templateFiles(templatesDir),
    });

    await runInit({
      projectRoot: '/project',
      directory: 'app-intents',
      examples: ['counter', 'restaurant', 'journal'],
      templatesDir,
    });

    expect(vol.existsSync('/project/app-intents/CreateJournalEntryShortcutIntent.swift')).toBe(
      true
    );
    expect(vol.existsSync('/project/app-intents/CreateJournalEntryIntent.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/Entities/JournalEntryEntity.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/Queries/JournalEntryQuery.swift')).toBe(true);

    const shortcuts = vol.readFileSync('/project/app-intents/AppShortcuts.swift', 'utf8') as string;
    expect(shortcuts).toContain('CreateJournalEntryShortcutIntent');
    expect(shortcuts).toContain('Create a journal entry in \\(.applicationName)');
  });

  it('merges into existing experiments and plugins without duplication', async () => {
    const templatesDir = '/pkg/templates';
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'my-app' }),
      '/project/app.json': JSON.stringify(
        {
          expo: {
            name: 'my-app',
            slug: 'my-app',
            plugins: ['expo-app-intents', ['other-plugin', {}]],
            experiments: { inlineModules: { watchedDirectories: ['modules'] }, typedRoutes: true },
          },
        },
        null,
        2
      ),
      ...templateFiles(templatesDir),
    });

    await runInit({
      projectRoot: '/project',
      directory: 'app-intents',
      examples: ['minimal'],
      templatesDir,
    });

    const appJson = JSON.parse(vol.readFileSync('/project/app.json', 'utf8') as string);
    expect(appJson.expo.experiments.inlineModules.watchedDirectories).toEqual([
      'modules',
      'app-intents',
    ]);
    expect(appJson.expo.experiments.typedRoutes).toBe(true);
    expect(
      appJson.expo.plugins.filter((plugin: unknown) => plugin === 'expo-app-intents')
    ).toHaveLength(1);
  });

  it('writes plugin props when using a custom directory', async () => {
    const templatesDir = '/pkg/templates';
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'my-app' }),
      '/project/app.json': JSON.stringify({ expo: { name: 'my-app', slug: 'my-app' } }, null, 2),
      ...templateFiles(templatesDir),
    });

    await runInit({
      projectRoot: '/project',
      directory: 'siri',
      examples: ['minimal'],
      templatesDir,
    });

    const appJson = JSON.parse(vol.readFileSync('/project/app.json', 'utf8') as string);
    expect(appJson.expo.experiments.inlineModules.watchedDirectories).toEqual(['siri']);
    expect(appJson.expo.plugins).toEqual([['expo-app-intents', { directory: 'siri' }]]);
  });

  it('does not overwrite existing intent files', async () => {
    const templatesDir = '/pkg/templates';
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'my-app' }),
      '/project/app.json': JSON.stringify({ expo: { name: 'my-app', slug: 'my-app' } }, null, 2),
      '/project/app-intents/AppShortcuts.swift': 'user-owned content',
      ...templateFiles(templatesDir),
    });

    await runInit({
      projectRoot: '/project',
      directory: 'app-intents',
      examples: ['minimal'],
      templatesDir,
    });

    expect(vol.readFileSync('/project/app-intents/AppShortcuts.swift', 'utf8')).toBe(
      'user-owned content'
    );
  });

  it('scaffolds files and warns when app.json does not exist (dynamic config)', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'my-app' }),
      '/project/app.config.js': 'module.exports = {};',
      ...templateFiles('/pkg/templates'),
    });

    await runInit({
      projectRoot: '/project',
      directory: 'app-intents',
      examples: ['minimal'],
      templatesDir: '/pkg/templates',
    });

    expect(vol.existsSync('/project/app-intents/AppShortcuts.swift')).toBe(true);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('app.config.js/ts'));
    warn.mockRestore();
  });
});
