import { compileModsAsync } from 'expo/config-plugins';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import withWidgetSourceFiles from '../ios/withWidgetSourceFiles';
import { WidgetConfig } from '../types/WidgetConfig.type';
import { WidgetFamily } from '../types/WidgetFamily.type';

describe(withWidgetSourceFiles, () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-widgets-test-'));
    fs.mkdirSync(path.join(projectRoot, 'ios'));
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it.each([false, true])(
    'generates supported families with configuration=%s',
    async (configured) => {
      const widget: WidgetConfig = {
        name: 'Example',
        displayName: 'Example',
        description: 'Example widget',
        ios: {
          supportedFamilies: [
            WidgetFamily.systemSmall,
            WidgetFamily.systemExtraLargePortrait,
            WidgetFamily.systemLarge,
          ],
          ...(configured && { configuration: { title: 'Example', parameters: {} } }),
        },
      };
      const generate = async () => {
        const config = withWidgetSourceFiles(
          { name: 'test', slug: 'test' },
          {
            widgets: [widget],
            targetName: 'Widgets',
            groupIdentifier: 'group.test',
            onFilesGenerated: () => {},
          }
        );
        await compileModsAsync(config, {
          projectRoot,
          platforms: ['ios'],
          assertMissingModProviders: false,
        });
        return fs.readFileSync(path.join(projectRoot, 'ios', 'Widgets', 'Example.swift'), 'utf8');
      };

      const portrait = await generate();
      expect(portrait)
        .toContain(`    var supportedFamilies: [WidgetFamily] = [.systemSmall, .systemLarge]
    if #available(iOS 27.0, *) {
      supportedFamilies.append(.systemExtraLargePortrait)
    }
    return ${configured ? 'AppIntentConfiguration' : 'StaticConfiguration'}`);
      expect(portrait).toContain('.supportedFamilies(supportedFamilies)');

      widget.ios!.supportedFamilies = [WidgetFamily.systemSmall, WidgetFamily.systemLarge];
      const existing = await generate();
      expect(existing).toContain('.supportedFamilies([.systemSmall, .systemLarge])');
      expect(existing).not.toContain('if #available(iOS 27.0, *)');
    }
  );
});
