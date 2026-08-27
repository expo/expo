import { withDangerousMod } from 'expo/config-plugins';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import withWidgetSourceFiles from '../ios/withWidgetSourceFiles';

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    withDangerousMod: jest.fn(),
  };
});

const targetName = 'ExpoWidgetsTarget';
const widgets = [
  {
    name: 'SampleWidget',
    displayName: 'Sample Widget',
    description: 'A sample widget.',
    supportedFamilies: ['systemSmall' as const],
  },
];

function createProjectRoot(): string {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-widgets-'));
  fs.mkdirSync(path.join(projectRoot, 'ios'), { recursive: true });
  return projectRoot;
}

async function runMod(projectRoot: string, locales?: Record<string, any>) {
  const generatedFiles: string[] = [];
  let modPromise: Promise<unknown> = Promise.resolve();
  (withDangerousMod as jest.Mock).mockImplementationOnce((config, [, action]) => {
    modPromise = action(config);
    return config;
  });

  withWidgetSourceFiles(
    {
      name: 'test',
      slug: 'test',
      locales,
      modRequest: { projectRoot, platformProjectRoot: path.join(projectRoot, 'ios') },
    } as any,
    {
      targetName,
      groupIdentifier: 'group.test',
      widgets,
      onFilesGenerated: (files) => generatedFiles.push(...files),
    }
  );

  await modPromise;
  return generatedFiles;
}

describe(withWidgetSourceFiles, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes a Localizable.strings file into the widget extension for every locale', async () => {
    const projectRoot = createProjectRoot();
    fs.mkdirSync(path.join(projectRoot, 'locales'));
    fs.writeFileSync(
      path.join(projectRoot, 'locales', 'de.json'),
      JSON.stringify({
        ios: {
          NSLocationWhenInUseUsageDescription: 'Deutscher Text.',
          'Sample Widget': 'Beispiel-Widget',
          'Localizable.strings': { 'A sample widget.': 'Ein Beispiel-Widget.' },
        },
      })
    );

    const generatedFiles = await runMod(projectRoot, { de: './locales/de.json' });

    const stringsPath = path.join(
      projectRoot,
      'ios',
      targetName,
      'de.lproj',
      'Localizable.strings'
    );
    expect(generatedFiles).toContain(stringsPath);
    expect(fs.readFileSync(stringsPath, 'utf8')).toMatchInlineSnapshot(`
      ""NSLocationWhenInUseUsageDescription" = "Deutscher Text.";
      "Sample Widget" = "Beispiel-Widget";
      "A sample widget." = "Ein Beispiel-Widget.";
      "
    `);
  });

  it('escapes quotes and backslashes in keys and values', async () => {
    const projectRoot = createProjectRoot();

    await runMod(projectRoot, { fr: { 'A "quoted" key': 'Une \\ valeur "citée"' } });

    const stringsPath = path.join(
      projectRoot,
      'ios',
      targetName,
      'fr.lproj',
      'Localizable.strings'
    );
    expect(fs.readFileSync(stringsPath, 'utf8')).toBe(
      '"A \\"quoted\\" key" = "Une \\\\ valeur \\"citée\\"";\n'
    );
  });

  it('writes no localization files when the app config has no locales', async () => {
    const projectRoot = createProjectRoot();

    const generatedFiles = await runMod(projectRoot);

    expect(fs.existsSync(path.join(projectRoot, 'ios', targetName, 'de.lproj'))).toBe(false);
    expect(generatedFiles.some((file) => file.endsWith('.strings'))).toBe(false);
  });
});
