"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const plist_1 = __importDefault(require("@expo/plist"));
const config_plugins_1 = require("expo/config-plugins");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const WidgetFamily_type_1 = require("../types/WidgetFamily.type");
const VALID_WIDGET_FAMILIES = new Set(Object.values(WidgetFamily_type_1.WidgetFamily));
function assertSwiftIdentifier(value, label) {
    if (typeof value !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
        throw new Error(`Invalid ${label} ${JSON.stringify(value)}: must be a Swift identifier.`);
    }
}
function assertWidgetFamily(value) {
    if (typeof value !== 'string' || !VALID_WIDGET_FAMILIES.has(value)) {
        throw new Error(`Invalid supportedFamilies entry ${JSON.stringify(value)}: must be one of ${[...VALID_WIDGET_FAMILIES].join(', ')}.`);
    }
}
function validateWidget(widget) {
    assertSwiftIdentifier(widget.name, 'widget name');
    const supportedFamilies = widget.ios?.supportedFamilies ?? widget.supportedFamilies ?? [];
    for (const family of supportedFamilies) {
        assertWidgetFamily(family);
    }
    const initialLayout = widget.ios?.initialLayout;
    if (initialLayout != null && path.isAbsolute(initialLayout)) {
        throw new Error(`Invalid initialLayout for ${JSON.stringify(widget.name)}: must be relative to the project root.`);
    }
    const configuration = widget.ios?.configuration ?? widget.configuration;
    if (configuration) {
        for (const [paramName, param] of Object.entries(configuration.parameters)) {
            assertSwiftIdentifier(paramName, 'parameter name');
            if (param.type === 'number' && typeof param.default !== 'number') {
                throw new Error(`Invalid default for ${JSON.stringify(paramName)}: must be a number.`);
            }
            else if (param.type === 'boolean' && typeof param.default !== 'boolean') {
                throw new Error(`Invalid default for ${JSON.stringify(paramName)}: must be a boolean.`);
            }
            else if (param.type === 'enum') {
                assertSwiftIdentifier(param.default, `default for ${JSON.stringify(paramName)}`);
                for (const value of param.values) {
                    assertSwiftIdentifier(value.value, `enum case for ${JSON.stringify(paramName)}`);
                }
            }
        }
    }
}
const withWidgetSourceFiles = (config, { widgets, targetName, onFilesGenerated, groupIdentifier }) => {
    for (const widget of widgets) {
        validateWidget(widget);
    }
    return (0, config_plugins_1.withDangerousMod)(config, [
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
            fs.writeFileSync(entitlementsPath, plist_1.default.build(entitlementsContent));
            const infoPlistPath = createInfoPlist(groupIdentifier, targetDirectory, config.ios?.version ?? config.version ?? '1.0', config.ios?.buildNumber ?? '1', existingInfoPlist);
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
const createIndexSwift = (widgets, targetPath) => {
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
    }
    else {
        output += addIndexSwiftChunk([], 0, true);
    }
    fs.writeFileSync(indexFilePath, output);
    return indexFilePath;
};
const createWidgetSwift = (widget, targetPath) => {
    const widgetFilePath = path.join(targetPath, `${widget.name}.swift`);
    fs.writeFileSync(widgetFilePath, widgetSwift(widget));
    return widgetFilePath;
};
const createLayoutRegistryConfig = (widgets, targetPath) => {
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
const createInfoPlist = (groupIdentifier, targetPath, marketingVersion, bundleVersion, existingInfoPlist) => {
    const infoPlistPath = `${targetPath}/Info.plist`;
    if (existingInfoPlist) {
        const parsedInfoPlist = plist_1.default.parse(existingInfoPlist);
        if (parsedInfoPlist.NSExtension?.NSExtensionPointIdentifier === 'com.apple.widgetkit-extension' &&
            parsedInfoPlist.ExpoWidgetsAppGroupIdentifier === groupIdentifier &&
            parsedInfoPlist.CFBundleShortVersionString === marketingVersion &&
            parsedInfoPlist.CFBundleVersion === bundleVersion) {
            fs.writeFileSync(infoPlistPath, existingInfoPlist);
            return infoPlistPath;
        }
    }
    fs.writeFileSync(infoPlistPath, infoPlist(groupIdentifier, marketingVersion, bundleVersion));
    return infoPlistPath;
};
const addIndexSwiftChunk = (widgets, index, isLastChunk) => `
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
const widgetSwift = (widget) => {
    const configuration = widget.ios?.configuration ?? widget.configuration;
    const supportedFamilies = widget.ios?.supportedFamilies ?? widget.supportedFamilies ?? [];
    const contentMarginsDisabled = widget.ios?.contentMarginsDisabled ?? widget.contentMarginsDisabled;
    if (!configuration)
        return `import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct ${widget.name}: Widget {
  let name: String = "${widget.name}"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName(${JSON.stringify(widget.displayName)})
    .description(${JSON.stringify(widget.description)})
    .supportedFamilies([.${supportedFamilies.join(', .')}])${contentMarginsDisabled ? '\n    .contentMarginsDisabled()' : ''}
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
        let paramType;
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
        return `  @Parameter(title: ${JSON.stringify(param.title)}, default: ${param.type === 'string' ? JSON.stringify(param.default) : param.type === 'number' ? param.default : param.type === 'boolean' ? param.default : `${widget.name}${name[0]?.toUpperCase() + name.slice(1)}Enum.${param.default}`})\n  var ${name}: ${paramType}`;
    })
        .join('\n')}

  func perform() async throws -> some IntentResult {
    return .result()
  }
}
${Object.entries(configuration?.parameters ?? {})
        .map(([name, param]) => {
        if (param.type !== 'enum')
            return '';
        const paramTypeName = `${widget.name}${name[0]?.toUpperCase() + name.slice(1)}Enum`;
        return `
enum ${paramTypeName}: String, CaseIterable, AppEnum {
  ${param.values
            .map((value) => {
            return `case ${value.value}`;
        })
            .join('\n  ')}

  static var typeDisplayRepresentation = TypeDisplayRepresentation(name: ${JSON.stringify(param.title)})

  static var caseDisplayRepresentations: [${paramTypeName}: DisplayRepresentation] = [
    ${param.values
            .map((value) => {
            return `.${value.value}: DisplayRepresentation(title: ${JSON.stringify(value.name)})`;
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
    guard let timeline = WidgetsStorage.getArray(forKey: "__expo_widgets_${widget.name}_timeline") else {
      return [${widget.name}TimelineEntry(date: Date(), name: "${widget.name}", props: nil, entryIndex: nil, configuration: configuration)]
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
    if let layout = WidgetsLayoutRegistry.layout(for: entry.name) {
      let node = evaluateLayout(layout: layout, props: entry.props, environment: widgetEnvironment)
      WidgetsDynamicView(name: entry.name, kind: .widget, node: node, entryIndex: entry.entryIndex, environmentString: widgetEnvironmentString)
    } else {
      WidgetsDynamicView(name: entry.name, kind: .widget, node: createRedBox(message: "No layout found for \\(WidgetsStorage.appGroupIdentifier ?? "")::\\(entry.name)"), entryIndex: entry.entryIndex, environmentString: widgetEnvironmentString)
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
    .configurationDisplayName(${JSON.stringify(widget.displayName)})
    .description(${JSON.stringify(widget.description)})
    .supportedFamilies([.${supportedFamilies.join(', .')}])${contentMarginsDisabled ? '\n    .contentMarginsDisabled()' : ''}
  }
}`;
};
const infoPlist = (groupIdentifier, marketingVersion, bundleVersion) => `<?xml version="1.0" encoding="UTF-8"?>
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
exports.default = withWidgetSourceFiles;
