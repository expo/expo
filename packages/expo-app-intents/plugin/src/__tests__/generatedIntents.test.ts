import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { renderIntents, syncIntents } from '../generatedIntents';
import withAppIntents from '../withAppIntents';

const intent = { name: 'orderFood', phrases: ['Order in {appName}'] };

describe('config-driven intents', () => {
  it('renders defaults, application-name interpolation and the refresh module', () => {
    const swift = renderIntents([intent]);
    expect(swift).toContain('struct GeneratedOrderFoodIntent: AppIntent');
    expect(swift).toContain('"Order Food"');
    expect(swift).toContain('"Order in \\(.applicationName)"');
    expect(swift).toContain('openAppWhenRun: Bool = true');
    expect(swift).toContain('final class GeneratedIntents: Module');
    expect(swift).toContain('GeneratedAppShortcuts.updateAppShortcutParameters()');
    expect(swift).not.toContain('ProvidesDialog');
  });

  it('escapes user interpolation and renders dialogs and handwritten references', () => {
    const swift = renderIntents([
      { ...intent, dialog: '"hi"\\(unsafe)\n', openAppWhenRun: false },
      { swiftType: 'TrackOrderIntent', phrases: ['Track in {appName}'] },
    ]);
    expect(swift).toContain('ProvidesDialog');
    expect(swift).toContain('\\"hi\\"\\\\(unsafe)\\u{a}');
    expect(swift).toContain('openAppWhenRun: Bool = false');
    expect(swift).toContain('intent: TrackOrderIntent()');
    expect(swift).not.toContain('struct TrackOrderIntent');
  });

  it.each([
    [{ ...intent, swiftType: 'Other' }],
    [{ ...intent, name: 'class' }],
    [{ ...intent, name: 'bad-name' }],
    [{ ...intent, phrases: [] }],
    [{ ...intent, phrases: ['No placeholder'] }],
    [intent, { ...intent, name: 'OrderFood' }],
    Array(11).fill(intent),
  ])('rejects invalid configuration %j', (...entries) => {
    expect(() => renderIntents(entries as any)).toThrow('expo-app-intents:');
  });

  it('does not render an empty provider', () => expect(renderIntents([])).toBe(''));

  it('automatically watches the directory without losing existing configuration', () => {
    const config = withAppIntents(
      {
        name: 'test',
        slug: 'test',
        experiments: {
          inlineModules: { watchedDirectories: ['native'], xcodeProjectTargets: ['test'] },
        },
      },
      { intents: [intent] }
    );
    expect(config.experiments?.inlineModules).toEqual({
      watchedDirectories: ['native', 'app-intents'],
      xcodeProjectTargets: ['test'],
    });
    expect(config.mods?.ios?.dangerous).toBeDefined();
  });

  let root: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'app-intents-test-'));
  });
  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('generates, updates and removes only owned files', async () => {
    const file = path.join(root, 'app-intents/GeneratedIntents.swift');
    await syncIntents(root, 'app-intents', [intent]);
    await syncIntents(root, 'app-intents', [intent]);
    expect(await fs.readFile(file, 'utf8')).toBe(renderIntents([intent]));
    await syncIntents(root, 'app-intents', [{ ...intent, dialog: 'Queued' }]);
    expect(await fs.readFile(file, 'utf8')).toContain('Queued');
    await syncIntents(root, 'app-intents');
    await expect(fs.stat(file)).rejects.toMatchObject({ code: 'ENOENT' });
    await fs.writeFile(file, '// user owned');
    await expect(syncIntents(root, 'app-intents', [intent])).rejects.toThrow('Refusing');
    await syncIntents(root, 'app-intents');
    expect(await fs.readFile(file, 'utf8')).toBe('// user owned');
  });

  it('rejects a nested provider or a generated type collision', async () => {
    await fs.mkdir(path.join(root, 'app-intents/nested'), { recursive: true });
    const file = path.join(root, 'app-intents/nested/User.swift');
    await fs.writeFile(file, 'struct User: AppShortcutsProvider {}');
    await expect(syncIntents(root, 'app-intents', [intent])).rejects.toThrow('provider');
    await fs.writeFile(file, 'struct GeneratedOrderFoodIntent {}');
    await expect(syncIntents(root, 'app-intents', [intent])).rejects.toThrow('conflicts');
  });
});
