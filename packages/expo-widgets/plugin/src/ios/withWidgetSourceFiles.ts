import plist from '@expo/plist';
import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

import { WidgetConfig } from '../types/WidgetConfig.type';
import { WidgetFamily } from '../types/WidgetFamily.type';

type WidgetSourceFilesProps = {
  targetName: string;
  groupIdentifier: string;
  widgets: WidgetConfig[];
  onFilesGenerated: (files: string[]) => void;
};

const VALID_WIDGET_FAMILIES: ReadonlySet<string> = new Set(Object.values(WidgetFamily));

function assertSwiftIdentifier(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid ${label} ${JSON.stringify(value)}: must be a Swift identifier.`);
  }
}

function assertWidgetFamily(value: unknown): asserts value is WidgetFamily {
  if (typeof value !== 'string' || !VALID_WIDGET_FAMILIES.has(value)) {
    throw new Error(
      `Invalid supportedFamilies entry ${JSON.stringify(value)}: must be one of ${[...VALID_WIDGET_FAMILIES].join(', ')}.`
    );
  }
}

function validateWidget(widget: WidgetConfig): void {
  assertSwiftIdentifier(widget.name, 'widget name');
  const supportedFamilies = widget.ios?.supportedFamilies ?? widget.supportedFamilies ?? [];
  for (const family of supportedFamilies) {
    assertWidgetFamily(family);
  }
  const initialLayout = widget.ios?.initialLayout;
  if (initialLayout != null && path.isAbsolute(initialLayout)) {
    throw new Error(
      `Invalid initialLayout for ${JSON.stringify(widget.name)}: must be relative to the project root.`
    );
  }
  const configuration = widget.ios?.configuration ?? widget.configuration;
  if (configuration) {
    for (const [paramName, param] of Object.entries(configuration.parameters)) {
      assertSwiftIdentifier(paramName, 'parameter name');
      if (param.type === 'number' && typeof param.default !== 'number') {
        throw new Error(`Invalid default for ${JSON.stringify(paramName)}: must be a number.`);
      } else if (param.type === 'boolean' && typeof param.default !== 'boolean') {
        throw new Error(`Invalid default for ${JSON.stringify(paramName)}: must be a boolean.`);
      } else if (param.type === 'enum') {
        assertSwiftIdentifier(param.default, `default for ${JSON.stringify(paramName)}`);
        for (const value of param.values) {
          assertSwiftIdentifier(value.value, `enum case for ${JSON.stringify(paramName)}`);
        }
      }
    }
  }
}

const withWidgetSourceFiles: ConfigPlugin<WidgetSourceFilesProps> = (
  config,
  { widgets, targetName, onFilesGenerated, groupIdentifier }
) => {
  for (const widget of widgets) {
    validateWidget(widget);
  }
  return withDangerousMod(config, [
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
      const layoutRegistryConfigPath = createLayoutRegistryConfig(widgets, targetDirectory);
      const indexSwiftPath = createIndexSwift(widgets, targetDirectory);
      const widgetSwiftPaths = widgets.map((widget) => createWidgetSwift(widget, targetDirectory));

      onFilesGenerated([
        entitlementsPath,
        infoPlistPath,
        layoutRegistryConfigPath,
        indexSwiftPath,
        ...widgetSwiftPaths,
      ]);

      return config;
    },
  ]);
};

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

const createLayoutRegistryConfig = (widgets: WidgetConfig[], targetPath: string): string => {
  const configPath = path.join(targetPath, 'ExpoWidgetsLayoutRegistry.config.json');
  const config = {
    widgets: widgets
      .filter((widget) => widget.ios?.initialLayout != null)
      .map((widget) => ({
        name: widget.name,
        initialLayout: widget.ios?.initialLayout,
      })),
  };

  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  return configPath;
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
        if (widget.ios?.configuration ?? widget.configuration) {
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

type WidgetParameter = NonNullable<
  NonNullable<WidgetConfig['ios']>['configuration']
>['parameters'][string];

const capitalize = (value: string): string => value[0]?.toUpperCase() + value.slice(1);

const enumTypeName = (widgetName: string, parameterName: string): string =>
  `${widgetName}${capitalize(parameterName)}Enum`;

const entityTypeName = (widgetName: string, parameterName: string): string =>
  `${widgetName}${capitalize(parameterName)}Entity`;

const isDynamicEnumParameter = (
  parameter: WidgetParameter
): parameter is Extract<WidgetParameter, { type: 'enum' }> & { dynamic: true } =>
  parameter.type === 'enum' && parameter.dynamic === true;

const parameterSwiftType = (
  widgetName: string,
  parameterName: string,
  parameter: WidgetParameter
): string => {
  switch (parameter.type) {
    case 'string':
      return 'String';
    case 'number':
      return 'Double';
    case 'boolean':
      return 'Bool';
    case 'enum':
      return enumTypeName(widgetName, parameterName);
    default:
      return 'String';
  }
};

const parameterDefaultValue = (
  widgetName: string,
  parameterName: string,
  parameter: WidgetParameter
): string => {
  switch (parameter.type) {
    case 'string':
    case 'enum':
      return isDynamicEnumParameter(parameter)
        ? JSON.stringify(parameter.default)
        : parameter.type === 'enum'
          ? `${enumTypeName(widgetName, parameterName)}.${parameter.default}`
          : JSON.stringify(parameter.default);
    case 'number':
    case 'boolean':
      return String(parameter.default);
    default:
      return '""';
  }
};

const parameterDeclaration = (
  widgetName: string,
  parameterName: string,
  parameter: WidgetParameter
): string => {
  if (isDynamicEnumParameter(parameter)) {
    return `  @Parameter(title: ${JSON.stringify(parameter.title)})\n  var ${parameterName}: ${entityTypeName(widgetName, parameterName)}?`;
  }
  return `  @Parameter(title: ${JSON.stringify(parameter.title)}, default: ${parameterDefaultValue(widgetName, parameterName, parameter)})\n  var ${parameterName}: ${parameterSwiftType(widgetName, parameterName, parameter)}`;
};

const configurationValueExpression = (
  parameterName: string,
  parameter: WidgetParameter
): string => {
  const valueAccess =
    parameter.type === 'enum' ? (isDynamicEnumParameter(parameter) ? '?.id' : '.rawValue') : '';
  return `      "${parameterName}": entry.configuration.${parameterName}${valueAccess}`;
};

const staticEnumSwift = (
  widgetName: string,
  parameterName: string,
  parameter: Extract<WidgetParameter, { type: 'enum' }>
): string => {
  if (isDynamicEnumParameter(parameter)) {
    return '';
  }
  const typeName = enumTypeName(widgetName, parameterName);
  return `
enum ${typeName}: String, CaseIterable, AppEnum {
  ${parameter.values
    .map((value) => {
      return `case ${value.value}`;
    })
    .join('\n  ')}

  static var typeDisplayRepresentation = TypeDisplayRepresentation(name: ${JSON.stringify(parameter.title)})

  static var caseDisplayRepresentations: [${typeName}: DisplayRepresentation] = [
    ${parameter.values
      .map((value) => {
        return `.${value.value}: DisplayRepresentation(title: ${JSON.stringify(value.name)})`;
      })
      .join(',\n    ')}
  ]
}`;
};

const dynamicEnumEntitySwift = (
  widgetName: string,
  parameterName: string,
  parameter: Extract<WidgetParameter, { type: 'enum' }> & { dynamic: true }
): string => {
  const typeName = entityTypeName(widgetName, parameterName);
  const defaultName =
    parameter.values.find((value) => value.value === parameter.default)?.name ?? parameter.default;
  return `
struct ${typeName}: AppEntity {
  static var typeDisplayRepresentation = TypeDisplayRepresentation(name: ${JSON.stringify(parameter.title)})
  static var defaultQuery = ${typeName}Query()

  let id: String
  let name: String
  let subtitle: String?

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(
      title: LocalizedStringResource(stringLiteral: name),
      subtitle: subtitle.map { LocalizedStringResource(stringLiteral: $0) }
    )
  }
}

struct ${typeName}Query: EntityQuery {
  private func options() -> [${typeName}] {
    widgetConfigurationOptions(
      name: ${JSON.stringify(widgetName)},
      parameter: ${JSON.stringify(parameterName)},
      fallback: [
${parameter.values
  .map((value) => {
    return `        WidgetConfigurationOption(name: ${JSON.stringify(value.name)}, value: ${JSON.stringify(value.value)})`;
  })
  .join(',\n')}
      ]
    ).map { ${typeName}(id: $0.value, name: $0.name, subtitle: $0.subtitle) }
  }

  // A saved value that is no longer in the options keeps its id, so the widget still gets it.
  func entities(for identifiers: [String]) async throws -> [${typeName}] {
    let all = options()
    return identifiers.map { id in
      all.first { $0.id == id } ?? ${typeName}(id: id, name: id, subtitle: nil)
    }
  }

  func suggestedEntities() async throws -> [${typeName}] {
    return options()
  }

  func defaultResult() async -> ${typeName}? {
    return options().first { $0.id == ${JSON.stringify(parameter.default)} }
      ?? ${typeName}(id: ${JSON.stringify(parameter.default)}, name: ${JSON.stringify(defaultName)}, subtitle: nil)
  }
}`;
};

const widgetSwift = (widget: WidgetConfig): string => {
  const configuration = widget.ios?.configuration ?? widget.configuration;
  const supportedFamilies = widget.ios?.supportedFamilies ?? widget.supportedFamilies ?? [];
  const hasExtraLargePortrait = supportedFamilies.includes(WidgetFamily.systemExtraLargePortrait);
  const otherFamilies = supportedFamilies.filter(
    (family) => family !== WidgetFamily.systemExtraLargePortrait
  );
  const familiesDeclaration = `    var supportedFamilies: [WidgetFamily] = [${otherFamilies.length ? '.' + otherFamilies.join(', .') : ''}]
${
  hasExtraLargePortrait
    ? `    if #available(iOS 27.0, *) {
      supportedFamilies.append(.systemExtraLargePortrait)
    }
`
    : ''
}`;
  const contentMarginsDisabled =
    widget.ios?.contentMarginsDisabled ?? widget.contentMarginsDisabled;
  if (!configuration)
    return `import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct ${widget.name}: Widget {
  let name: String = "${widget.name}"

  var body: some WidgetConfiguration {
${familiesDeclaration}    return StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName(${JSON.stringify(widget.displayName)})
    .description(${JSON.stringify(widget.description)})
    .supportedFamilies(supportedFamilies)${contentMarginsDisabled ? '\n    .contentMarginsDisabled()' : ''}
  }
}`;
  return `import WidgetKit
import SwiftUI
import AppIntents
internal import ExpoWidgets

// AppIntent
struct ${widget.name}ConfigurationAppIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = ${JSON.stringify(`${configuration?.title ?? widget.displayName} Configuration`)}
${configuration?.description ? `  static var description: LocalizedStringResource = ${JSON.stringify(configuration.description)}\n` : ''}
${Object.entries(configuration?.parameters ?? {})
  .map(([name, param]) => {
    return parameterDeclaration(widget.name, name, param);
  })
  .join('\n')}

  func perform() async throws -> some IntentResult {
    return .result()
  }
}
${Object.entries(configuration?.parameters ?? {})
  .map(([name, param]) => {
    if (param.type !== 'enum') return '';
    return isDynamicEnumParameter(param)
      ? dynamicEnumEntitySwift(widget.name, name, param)
      : staticEnumSwift(widget.name, name, param);
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
    ${widget.name}TimelineEntry(date: Date(), name: "${widget.name}", props: WidgetsLayoutRegistry.initialProps(for: "${widget.name}"), entryIndex: nil, configuration: ${widget.name}ConfigurationAppIntent())
  }

  func snapshot(for configuration: ${widget.name}ConfigurationAppIntent, in context: Context) async -> ${widget.name}TimelineEntry {
    let entries = parseTimeline(configuration: configuration)
    return entries.first ?? ${widget.name}TimelineEntry(date: Date(), name: "${widget.name}", props: WidgetsLayoutRegistry.initialProps(for: "${widget.name}"), entryIndex: nil, configuration: configuration)
  }

  func timeline(for configuration: ${widget.name}ConfigurationAppIntent, in context: Context) async -> Timeline<${widget.name}TimelineEntry> {
    let entries = self.parseTimeline(configuration: configuration)
    let timeline = Timeline<${widget.name}TimelineEntry>(entries: entries, policy: .atEnd)
    return timeline
  }
  
  func parseTimeline(configuration: ${widget.name}ConfigurationAppIntent) -> [${widget.name}TimelineEntry] {
    guard let timeline = WidgetsStorage.getArray(forKey: "__expo_widgets_${widget.name}_timeline") else {
      return [${widget.name}TimelineEntry(date: Date(), name: "${widget.name}", props: WidgetsLayoutRegistry.initialProps(for: "${widget.name}"), entryIndex: nil, configuration: configuration)]
    }
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
  ${Object.entries(configuration?.parameters ?? {})
    .map(([name, param]) => {
      return configurationValueExpression(name, param);
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
    if let layout = WidgetsLayoutRegistry.layout(for: entry.name) {
      let node = evaluateLayout(layout: layout, props: entry.props, environment: widgetEnvironment)
      WidgetsDynamicView(name: entry.name, kind: .widget, node: node, entryIndex: entry.entryIndex, environmentString: widgetEnvironmentString)
    } else {
      EmptyWidgetView()
    }
  }
}


@available(iOS 17.0, *)
struct ${widget.name}: Widget {
  let name: String = "${widget.name}"

  var body: some WidgetConfiguration {
${familiesDeclaration}    return AppIntentConfiguration(kind: name, intent: ${widget.name}ConfigurationAppIntent.self, provider: ${widget.name}TimelineProvider()) { entry in
      ${widget.name}EntryView(entry: entry)
    }
    .configurationDisplayName(${JSON.stringify(widget.displayName)})
    .description(${JSON.stringify(widget.description)})
    .supportedFamilies(supportedFamilies)${contentMarginsDisabled ? '\n    .contentMarginsDisabled()' : ''}
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
