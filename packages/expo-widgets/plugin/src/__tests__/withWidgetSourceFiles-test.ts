import type { ExpoConfig } from 'expo/config';
import { type ExportedConfigWithProps, type Mod, withDangerousMod } from 'expo/config-plugins';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import withWidgetSourceFiles from '../ios/withWidgetSourceFiles';
import { WidgetConfig } from '../types/WidgetConfig.type';

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    withDangerousMod: jest.fn(),
  };
});

const config = { name: 'test', slug: 'test' } as ExpoConfig;
const targetName = 'widgets';

let platformProjectRoot: string;

async function generateWidgetSwift(widget: WidgetConfig): Promise<string> {
  let mod: Mod<unknown> | undefined;
  jest.mocked(withDangerousMod).mockImplementationOnce((config, [, action]) => {
    mod = action;
    return config as ExpoConfig;
  });

  withWidgetSourceFiles(config, {
    widgets: [widget],
    targetName,
    groupIdentifier: 'group.test',
    onFilesGenerated: () => {},
  });
  await mod?.({
    ...config,
    modRequest: { platformProjectRoot },
  } as ExportedConfigWithProps<unknown>);

  return fs.readFileSync(
    path.join(platformProjectRoot, targetName, `${widget.name}.swift`),
    'utf8'
  );
}

const widget: WidgetConfig = {
  name: 'MyWidget',
  displayName: 'My Widget',
  description: 'A widget',
  ios: { supportedFamilies: ['systemSmall'] },
};

const configurableWidget: WidgetConfig = {
  ...widget,
  ios: {
    supportedFamilies: ['systemSmall'],
    configuration: {
      title: 'My Widget',
      parameters: { label: { title: 'Label', type: 'string', default: 'Hello' } },
    },
  },
};

describe(withWidgetSourceFiles, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    platformProjectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-widgets-'));
  });

  afterEach(() => {
    fs.rmSync(platformProjectRoot, { recursive: true, force: true });
  });

  it('renders a widget with the shared entry view', async () => {
    await expect(generateWidgetSwift(widget)).resolves.toContain('WidgetsEntryView(entry: entry)');
  });

  it('applies the fallback container background in a configurable widget entry view', async () => {
    await expect(generateWidgetSwift(configurableWidget)).resolves.toContain(
      '.fallbackContainerBackground(forLayout: node)'
    );
  });
});
