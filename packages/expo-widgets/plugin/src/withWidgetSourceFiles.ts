import plist from '@expo/plist';
import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

import { WidgetConfig } from './types/WidgetConfig.type';

interface WidgetSourceFilesProps {
  widgets: WidgetConfig[];
  bundleIdentifier: string;
  targetName: string;
  groupIdentifier: string;
  onFilesGenerated: (files: string[]) => void;
}

const withWidgetSourceFiles: ConfigPlugin<WidgetSourceFilesProps> = (
  config,
  { widgets, bundleIdentifier, targetName, onFilesGenerated, groupIdentifier }
) =>
  withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const targetDirectory = path.join(projectRoot, targetName);
      if (fs.existsSync(targetDirectory)) {
        fs.rmSync(targetDirectory, { recursive: true, force: true });
      }
      if (!fs.existsSync(targetDirectory)) {
        fs.mkdirSync(targetDirectory, { recursive: true });
      }
      const entitlementsPath = path.join(targetDirectory, `${targetName}.entitlements`);
      const entitlementsContent = {
        'com.apple.security.application-groups': [groupIdentifier],
      };
      fs.writeFileSync(entitlementsPath, plist.build(entitlementsContent));

      const infoPlistPath = `${targetDirectory}/Info.plist`;
      fs.writeFileSync(infoPlistPath, infoPlist);

      const indexSwiftPath = createIndexSwift(widgets, targetDirectory);
      const providerSwiftPath = createProviderSwift(targetDirectory);

      const widgetSwiftPaths = widgets.map((widget) =>
        createWidgetSwift(bundleIdentifier, widget, targetDirectory)
      );

      onFilesGenerated([
        entitlementsPath,
        infoPlistPath,
        indexSwiftPath,
        providerSwiftPath,
        ...widgetSwiftPaths,
      ]);

      return config;
    },
  ]);

const createProviderSwift = (targetPath: string) => {
  const providerFilePath = path.join(targetPath, `Provider.swift`);
  fs.writeFileSync(providerFilePath, providerSwift);
  return path.join(targetPath, 'Provider.swift');
};

const createIndexSwift = (widgets: WidgetConfig[], targetPath: string): string => {
  const indexFilePath = path.join(targetPath, `index.swift`);
  const numberOfWidgets = widgets.length;
  const numberOfBundles = Math.ceil(numberOfWidgets / 4);
  let output = `import WidgetKit
import SwiftUI 
  `;

  for (let i = 0; i < numberOfBundles; i++) {
    const start = i * 4;
    const end = Math.min(start + 4, numberOfWidgets);
    const widgetChunk = widgets.slice(start, end);
    const isLastChunk = i === numberOfBundles - 1;
    output += addIndexSwiftChunk(widgetChunk, i, isLastChunk);
  }

  fs.writeFileSync(indexFilePath, output);
  return indexFilePath;
};

const createWidgetSwift = (
  bundleIdentifier: string,
  widget: WidgetConfig,
  targetPath: string
): string => {
  const widgetFilePath = path.join(targetPath, `${widget.name}.swift`);
  fs.writeFileSync(widgetFilePath, widgetSwift(bundleIdentifier, widget));
  return widgetFilePath;
};

const addIndexSwiftChunk = (
  widgets: WidgetConfig[],
  index: number,
  isLastChunk: boolean
): string => `
${index === 0 ? '@main' : ''}
struct ExportWidgets${index}: WidgetBundle {
  var body: some Widget {
    ${widgets.map((widget) => `${widget.name}()`).join('\n\t\t')}
    ${!isLastChunk ? `ExportWidgets${index + 1}().body` : `ExpoWidgets.WidgetLiveActivity()`}
  }
}`;

const widgetSwift = (bundleIdentifier: string, widget: WidgetConfig): string => `
import WidgetKit
import SwiftUI

struct ${widget.name}: Widget {
  let kind: String = "${widget.name}"
  let buildleIdentifier: String = "${bundleIdentifier}"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      WidgetEntryView(entry: entry)
    }
    .configurationDisplayName("${widget.displayName}")
    .description("${widget.description}")
    .supportedFamilies([.${widget.supportedFamilies.join(', .')}])
  }
}`;

const providerSwift = `import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> SimpleEntry {
    SimpleEntry(date: Date())
  }

  func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
    let entry = SimpleEntry(date: Date())
    completion(entry)
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ()) {
    var entries: [SimpleEntry] = []

    let currentDate = Date()
    for hourOffset in 0 ..< 5 {
      if let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate) {
        let entry = SimpleEntry(date: entryDate)
        entries.append(entry)
      }
    }

    let timeline = Timeline(entries: entries, policy: .atEnd)
    completion(timeline)
  }
}

struct SimpleEntry: TimelineEntry {
  let date: Date
}

struct WidgetEntryView : View {
  var entry: Provider.Entry

  var body: some View {
    VStack {
      Text("Time:")
      Text(entry.date, style: .time)
    }
  }
}`;

const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>NSExtension</key>
	<dict>
		<key>NSExtensionPointIdentifier</key>
		<string>com.apple.widgetkit-extension</string>
	</dict>
</dict>
</plist>
`;

export default withWidgetSourceFiles;
