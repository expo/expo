import plist from '@expo/plist';
import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

import { WidgetConfig } from './types/WidgetConfig.type';

type WidgetSourceFilesProps = {
  targetName: string;
  groupIdentifier: string;
  widgets: WidgetConfig[];
  onFilesGenerated: (files: string[]) => void;
};

const withWidgetSourceFiles: ConfigPlugin<WidgetSourceFilesProps> = (
  config,
  { widgets, targetName, onFilesGenerated, groupIdentifier }
) =>
  withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const targetDirectory = path.join(projectRoot, targetName);
      const existingInfoPlistPath = path.join(targetDirectory, 'Info.plist');
      const existingInfoPlist = fs.existsSync(existingInfoPlistPath)
        ? fs.readFileSync(existingInfoPlistPath, 'utf8')
        : null;
      if (fs.existsSync(targetDirectory)) {
        fs.rmSync(targetDirectory, { recursive: true, force: true });
      }
      fs.mkdirSync(targetDirectory, { recursive: true });
      const entitlementsPath = path.join(targetDirectory, `${targetName}.entitlements`);
      const entitlementsContent = {
        'com.apple.security.application-groups': [groupIdentifier],
      };
      fs.writeFileSync(entitlementsPath, plist.build(entitlementsContent));

      const infoPlistPath = createInfoPlist(
        groupIdentifier,
        targetDirectory,
        config.ios?.version ?? config.version ?? '1.0',
        config.ios?.buildNumber ?? '1',
        existingInfoPlist
      );
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
internal import ExpoWidgets
`;

  if (numberOfWidgets > 0) {
    for (let i = 0; i < numberOfBundles; i++) {
      const start = i * 4;
      const end = Math.min(start + 4, numberOfWidgets);
      const widgetChunk = widgets.slice(start, end);
      const isLastChunk = i === numberOfBundles - 1;
      output += addIndexSwiftChunk(widgetChunk, i, isLastChunk);
    }
  } else {
    output += addIndexSwiftChunk([], 0, true);
  }

  fs.writeFileSync(indexFilePath, output);
  return indexFilePath;
};

const createWidgetSwift = (widget: WidgetConfig, targetPath: string): string => {
  const widgetFilePath = path.join(targetPath, `${widget.name}.swift`);
  fs.writeFileSync(widgetFilePath, widgetSwift(widget));
  return widgetFilePath;
};

const createInfoPlist = (
  groupIdentifier: string,
  targetPath: string,
  marketingVersion: string,
  bundleVersion: string,
  existingInfoPlist: string | null
): string => {
  const infoPlistPath = `${targetPath}/Info.plist`;

  if (existingInfoPlist) {
    const parsedInfoPlist = plist.parse(existingInfoPlist);
    if (
      parsedInfoPlist.NSExtension?.NSExtensionPointIdentifier === 'com.apple.widgetkit-extension' &&
      parsedInfoPlist.ExpoWidgetsAppGroupIdentifier === groupIdentifier &&
      parsedInfoPlist.CFBundleShortVersionString === marketingVersion &&
      parsedInfoPlist.CFBundleVersion === bundleVersion
    ) {
      fs.writeFileSync(infoPlistPath, existingInfoPlist);
      return infoPlistPath;
    }
  }

  fs.writeFileSync(infoPlistPath, infoPlist(groupIdentifier, marketingVersion, bundleVersion));
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
    ${widgets
      .map((widget) => {
        if (widget.configuration) {
          return `if #available(iOS 17.0, *) {
      ${widget.name}()
    }`;
        }
        return `${widget.name}()`;
      })
      .join('\n    ')}
    ${!isLastChunk ? `ExportWidgets${index + 1}().body` : `WidgetLiveActivity()`}
  }
}`;

const widgetSwift = (widget: WidgetConfig): string => {
  if (!widget.configuration)
    return `import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct ${widget.name}: Widget {
  let name: String = "${widget.name}"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("${widget.displayName}")
    .description("${widget.description}")
    .supportedFamilies([.${widget.supportedFamilies.join(', .')}])${widget.contentMarginsDisabled ? '\n    .contentMarginsDisabled()' : ''}
  }
}`;
  return `import WidgetKit
import SwiftUI
import AppIntents
internal import ExpoWidgets

// AppIntent
struct ${widget.name}ConfigurationAppIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "${widget.configuration?.title ?? widget.displayName} Configuration"
${widget.configuration?.description ? `  static var description: LocalizedStringResource = "${widget.configuration?.description}"\n` : ''}
${Object.entries(widget.configuration?.parameters ?? {})
  .map(([name, param]) => {
    let paramType: string;
    switch (param.type) {
      case 'string':
        paramType = 'String';
        break;
      case 'number':
        paramType = 'Double';
        break;
      case 'boolean':
        paramType = 'Bool';
        break;
      case 'enum':
        paramType = `${widget.name}${name[0]?.toUpperCase() + name.slice(1)}Enum`;
        break;
      default:
        paramType = 'String';
    }
    return `  @Parameter(title: "${param.title}", default: ${param.type === 'string' ? `"${param.default}"` : param.type === 'number' ? param.default : param.type === 'boolean' ? param.default : `${widget.name}${name[0]?.toUpperCase() + name.slice(1)}Enum.${param.default}`})\n  var ${name}: ${paramType}`;
  })
  .join('\n')}

  func perform() async throws -> some IntentResult {
    return .result()
  }
}
${Object.entries(widget.configuration?.parameters ?? {})
  .map(([name, param]) => {
    if (param.type !== 'enum') return '';
    const paramTypeName = `${widget.name}${name[0]?.toUpperCase() + name.slice(1)}Enum`;
    return `
enum ${paramTypeName}: String, CaseIterable, AppEnum {
  ${param.values
    .map((value) => {
      return `case ${value.value}`;
    })
    .join('\n  ')}

  static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "${param.title}")

  static var caseDisplayRepresentations: [${paramTypeName}: DisplayRepresentation] = [
    ${param.values
      .map((value) => {
        return `.${value.value}: DisplayRepresentation(title: "${value.name}")`;
      })
      .join(',\n    ')}
  ]
}`;
  })
  .join('\n')}

struct ${widget.name}TimelineEntry: TimelineEntry {
  let date: Date
  public let name: String
  public let props: [String: Any]?
  public let entryIndex: Int?
  let configuration: ${widget.name}ConfigurationAppIntent
}

struct ${widget.name}TimelineProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> ${widget.name}TimelineEntry {
    ${widget.name}TimelineEntry(date: Date(), name: "${widget.name}", props: nil, entryIndex: nil, configuration: ${widget.name}ConfigurationAppIntent())
  }

  func snapshot(for configuration: ${widget.name}ConfigurationAppIntent, in context: Context) async -> ${widget.name}TimelineEntry {
    let entries = parseTimeline(configuration: configuration)
    return entries.first ?? ${widget.name}TimelineEntry(date: Date(), name: "${widget.name}", props: nil, entryIndex: nil, configuration: configuration)
  }

  func timeline(for configuration: ${widget.name}ConfigurationAppIntent, in context: Context) async -> Timeline<${widget.name}TimelineEntry> {
    let entries = self.parseTimeline(configuration: configuration)
    let timeline = Timeline<${widget.name}TimelineEntry>(entries: entries, policy: .atEnd)
    return timeline
  }
  
  func parseTimeline(configuration: ${widget.name}ConfigurationAppIntent) -> [${widget.name}TimelineEntry] {
    let timeline = WidgetsStorage.getArray(forKey: "__expo_widgets_${widget.name}_timeline") ?? []
    let entries: [${widget.name}TimelineEntry?] = timeline.enumerated().map { index, entry in
      guard let entry = entry as? [String: Any], let timestamp = entry["timestamp"] as? Int, let props = entry["props"] as? [String: Any] else {
        return nil
      }
      return ${widget.name}TimelineEntry(
        date: Date(timeIntervalSince1970: Double(timestamp) / 1000),
        name: "${widget.name}",
        props: props,
        entryIndex: index,
        configuration: configuration
      )
    }

    return entries.compactMap(\\.self)
  }
}

struct ${widget.name}EntryView: View {
  @Environment(\\.self) var environment
  var entry: ${widget.name}TimelineProvider.Entry

  init(entry: ${widget.name}TimelineProvider.Entry) {
    self.entry = entry
  }

  private var widgetEnvironment: [String: Any] {
    var env: [String: Any] = getWidgetEnvironment(environment: environment)
    env["timestamp"] = Int(entry.date.timeIntervalSince1970 * 1000)
    env["configuration"] = [
${Object.entries(widget.configuration?.parameters ?? {})
  .map(([name, param]) => {
    return `      "${name}": entry.configuration.${name}${param.type === 'enum' ? '.rawValue' : ''}`;
  })
  .join(',\n')}
    ]
    return env
  }

  private var widgetEnvironmentString: String? {
    guard let data = try? JSONSerialization.data(withJSONObject: widgetEnvironment),
          let jsonString = String(data: data, encoding: .utf8) else {
        return nil
    }
    return jsonString
  }

  public var body: some View {
    let layout = WidgetsStorage.getString(forKey: "__expo_widgets_\\(entry.name)_layout") ?? ""
    let node = evaluateLayout(layout: layout, props: entry.props ?? [:], environment: widgetEnvironment)

    if let node {
      WidgetsDynamicView(name: entry.name, kind: .widget, node: node, entryIndex: entry.entryIndex, environmentString: widgetEnvironmentString)
    } else {
      EmptyView()
    }
  }
}


@available(iOS 17.0, *)
struct ${widget.name}: Widget {
  let name: String = "${widget.name}"

  var body: some WidgetConfiguration {
    return AppIntentConfiguration(kind: name, intent: ${widget.name}ConfigurationAppIntent.self, provider: ${widget.name}TimelineProvider()) { entry in
      ${widget.name}EntryView(entry: entry)
    }
    .configurationDisplayName("${widget.displayName}")
    .description("${widget.description}")
    .supportedFamilies([.${widget.supportedFamilies.join(', .')}])${widget.contentMarginsDisabled ? '\n    .contentMarginsDisabled()' : ''}
  }
}`;
};

const infoPlist = (
  groupIdentifier: string,
  marketingVersion: string,
  bundleVersion: string
) => `<?xml version="1.0" encoding="UTF-8"?>
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
	<key>CFBundleShortVersionString</key>
	<string>${marketingVersion}</string>
	<key>CFBundleVersion</key>
	<string>${bundleVersion}</string>
</dict>
</plist>
`;

export default withWidgetSourceFiles;
