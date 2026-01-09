import plist from '@expo/plist';
import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

import { WidgetConfig } from './types/WidgetConfig.type';

interface WidgetSourceFilesProps {
  widgets: WidgetConfig[];
  targetName: string;
  groupIdentifier: string;
  onFilesGenerated: (files: string[]) => void;
}

const withWidgetSourceFiles: ConfigPlugin<WidgetSourceFilesProps> = (
  config,
  { widgets, targetName, onFilesGenerated, groupIdentifier }
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

      const infoPlistPath = createInfoPlist(groupIdentifier, targetDirectory);
      const indexSwiftPath = createIndexSwift(widgets, targetDirectory);
      const widgetSwiftPaths = widgets.map((widget) => createWidgetSwift(widget, targetDirectory));

      onFilesGenerated([entitlementsPath, infoPlistPath, indexSwiftPath, ...widgetSwiftPaths]);

      return config;
    },
  ]);

const createIndexSwift = (widgets: WidgetConfig[], targetPath: string): string => {
  const indexFilePath = path.join(targetPath, `index.swift`);
  const numberOfWidgets = widgets.length;
  const numberOfBundles = Math.ceil(numberOfWidgets / 4);
  let output = `import WidgetKit
import SwiftUI
import ExpoWidgets
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

const createWidgetSwift = (widget: WidgetConfig, targetPath: string): string => {
  const widgetFilePath = path.join(targetPath, `${widget.name}.swift`);
  fs.writeFileSync(widgetFilePath, widgetSwift(widget));
  return widgetFilePath;
};

const createInfoPlist = (groupIdentifier: string, targetPath: string): string => {
  const infoPlistPath = `${targetPath}/Info.plist`;
  fs.writeFileSync(infoPlistPath, infoPlist(groupIdentifier));
  return infoPlistPath;
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
    ${!isLastChunk ? `ExportWidgets${index + 1}().body` : `WidgetLiveActivity()`}
  }
}`;

const widgetSwift = (widget: WidgetConfig): string => `import WidgetKit
import SwiftUI
import ExpoWidgets

struct ${widget.name}: Widget {
  let name: String = "${widget.name}"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("${widget.displayName}")
    .description("${widget.description}")
    .supportedFamilies([.${widget.supportedFamilies.join(', .')}])
  }
}`;

const infoPlist = (groupIdentifier: string) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>NSExtension</key>
	<dict>
		<key>NSExtensionPointIdentifier</key>
		<string>com.apple.widgetkit-extension</string>
	</dict>
  <key>ExpoWidgetsAppGroupIdentifier</key>
  <string>${groupIdentifier}</string>
</dict>
</plist>
`;

export default withWidgetSourceFiles;
