import { vol } from 'memfs';
import prompts from 'prompts';

import {
  getExamplesPrompt,
  getVisualIntelligencePrompt,
  normalizeDirectory,
  resolveExamples,
  resolveExamplesAsync,
  runInit,
} from '../cli/init';

jest.mock('fs', () => require('memfs').fs);
jest.mock('fs/promises', () => require('memfs').fs.promises);
jest.mock('prompts', () => ({ __esModule: true, default: jest.fn() }));

const mockedPrompts = prompts as unknown as jest.Mock;

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
          description: expect.stringContaining('only the setup module'),
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
          value: 'mail',
          description: expect.stringContaining('schema domains'),
        }),
      ])
    );
  });

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
    expect(mockedPrompts.mock.calls[1][0]).toMatchObject({
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

    // No example contributes a phrase, so no provider is written: the App Intents metadata
    // extractor rejects an `AppShortcutsProvider` that has no `AppShortcut` in it.
    expect(vol.existsSync('/project/app-intents/AppShortcuts.swift')).toBe(false);
    expect(vol.existsSync('/project/app-intents/AppIntentsSetup.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/IncreaseCounterIntent.swift')).toBe(false);

    // With no provider the setup module must not refer to one.
    const setup = vol.readFileSync('/project/app-intents/AppIntentsSetup.swift', 'utf8') as string;
    expect(setup).toContain('Name("AppIntentsSetup")');
    expect(setup).not.toContain('AppShortcuts');
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
    expect(vol.existsSync('/project/app-intents/CreateDraftIntent.swift')).toBe(false);

    const shortcuts = vol.readFileSync('/project/app-intents/AppShortcuts.swift', 'utf8') as string;
    expect(shortcuts).toContain('IncreaseCounterIntent');
    expect(shortcuts).toContain('OrderFoodIntent');
    expect(shortcuts).not.toContain('CreateDraftIntent');
  });

  it('scaffolds the mail example without adding a shortcut phrase', async () => {
    const templatesDir = '/pkg/templates';
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'my-app' }),
      '/project/app.json': JSON.stringify({ expo: { name: 'my-app', slug: 'my-app' } }, null, 2),
      ...templateFiles(templatesDir),
    });

    await runInit({
      projectRoot: '/project',
      directory: 'app-intents',
      examples: ['counter', 'restaurant', 'mail'],
      templatesDir,
    });

    expect(vol.existsSync('/project/app-intents/CreateDraftIntent.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/DeleteDraftIntent.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/Entities/MailDraftEntity.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/Entities/MailAccountEntity.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/Queries/MailDraftEntityQuery.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/Queries/MailAccountEntityQuery.swift')).toBe(true);

    // The mail schema intents are discovered from App Intents metadata, so the example
    // deliberately contributes no AppShortcut phrase.
    const shortcuts = vol.readFileSync('/project/app-intents/AppShortcuts.swift', 'utf8') as string;
    expect(shortcuts).toContain('IncreaseCounterIntent');
    expect(shortcuts).toContain('OrderFoodIntent');
    expect(shortcuts).not.toContain('Draft');
  });

  it('writes no shortcuts provider when no example contributes a phrase', async () => {
    const templatesDir = '/pkg/templates';
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'my-app' }),
      '/project/app.json': JSON.stringify({ expo: { name: 'my-app', slug: 'my-app' } }, null, 2),
      ...templateFiles(templatesDir),
    });

    await runInit({
      projectRoot: '/project',
      directory: 'app-intents',
      examples: ['mail'],
      templatesDir,
    });

    expect(vol.existsSync('/project/app-intents/CreateDraftIntent.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/AppShortcuts.swift')).toBe(false);
  });

  it('adds the visual intelligence layer to the mail example when requested', async () => {
    const templatesDir = '/pkg/templates';
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'my-app' }),
      '/project/app.json': JSON.stringify({ expo: { name: 'my-app', slug: 'my-app' } }, null, 2),
      ...templateFiles(templatesDir),
    });

    await runInit({
      projectRoot: '/project',
      directory: 'app-intents',
      examples: ['mail'],
      visualIntelligence: true,
      templatesDir,
    });

    // The base mail example is still scaffolded unchanged.
    expect(vol.existsSync('/project/app-intents/CreateDraftIntent.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/DeleteDraftIntent.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/Entities/MailDraftEntity.swift')).toBe(true);

    // Plus the additive visual intelligence layer.
    expect(vol.existsSync('/project/app-intents/OpenMailDraftIntent.swift')).toBe(true);
    expect(vol.existsSync('/project/app-intents/Entities/MailDraftEntity+Spotlight.swift')).toBe(
      true
    );
    expect(vol.existsSync('/project/app-intents/Entities/MailDraftEntity+Transferable.swift')).toBe(
      true
    );
    expect(vol.existsSync('/project/app-intents/Queries/MailDraftEntityQuery+Indexed.swift')).toBe(
      true
    );

    // The generated setup module registers the entity kind and exposes the indexing bridge.
    const setup = vol.readFileSync('/project/app-intents/AppIntentsSetup.swift', 'utf8') as string;
    expect(setup).toContain('AppEntityIdentifierRegistry.shared.registerIndexed("mailDraft"');
    // Indexing is driven by setEntityCatalogAsync now, so the scaffold exposes no bridge for it.
    expect(setup).not.toContain('AsyncFunction');
    // mail contributes no phrase, so there is no provider to wire up.
    expect(vol.existsSync('/project/app-intents/AppShortcuts.swift')).toBe(false);
    expect(setup).not.toContain('AppShortcuts');
  });

  it('scaffolds no visual intelligence files by default', async () => {
    const templatesDir = '/pkg/templates';
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'my-app' }),
      '/project/app.json': JSON.stringify({ expo: { name: 'my-app', slug: 'my-app' } }, null, 2),
      ...templateFiles(templatesDir),
    });

    await runInit({
      projectRoot: '/project',
      directory: 'app-intents',
      examples: ['mail'],
      templatesDir,
    });

    expect(vol.existsSync('/project/app-intents/OpenMailDraftIntent.swift')).toBe(false);
    expect(vol.existsSync('/project/app-intents/Entities/MailDraftEntity+Spotlight.swift')).toBe(
      false
    );
    const plainSetup = vol.readFileSync(
      '/project/app-intents/AppIntentsSetup.swift',
      'utf8'
    ) as string;
    expect(plainSetup).not.toContain('AppEntityIdentifierRegistry');
    expect(plainSetup).not.toContain('registerIndexed');
  });

  it('rejects visual intelligence without the mail example', async () => {
    const templatesDir = '/pkg/templates';
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'my-app' }),
      '/project/app.json': JSON.stringify({ expo: { name: 'my-app', slug: 'my-app' } }, null, 2),
      ...templateFiles(templatesDir),
    });

    await expect(
      runInit({
        projectRoot: '/project',
        directory: 'app-intents',
        examples: ['counter'],
        visualIntelligence: true,
        templatesDir,
      })
    ).rejects.toThrow(/--visual-intelligence extends the mail example/);
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

    expect(vol.existsSync('/project/app-intents/AppIntentsSetup.swift')).toBe(true);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('app.config.js/ts'));
    warn.mockRestore();
  });
});
