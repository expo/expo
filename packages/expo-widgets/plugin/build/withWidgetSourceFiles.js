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
const withWidgetSourceFiles = (config, { widgets, bundleIdentifier, targetName, onFilesGenerated, groupIdentifier }) => (0, config_plugins_1.withDangerousMod)(config, [
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
        fs.writeFileSync(entitlementsPath, plist_1.default.build(entitlementsContent));
        const infoPlistPath = `${targetDirectory}/Info.plist`;
        fs.writeFileSync(infoPlistPath, infoPlist(groupIdentifier));
        const indexSwiftPath = createIndexSwift(widgets, targetDirectory);
        const providerSwiftPath = createProviderSwift(targetDirectory);
        const widgetSwiftPaths = widgets.map((widget) => createWidgetSwift(bundleIdentifier, widget, targetDirectory));
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
const createProviderSwift = (targetPath) => {
    const providerFilePath = path.join(targetPath, `Provider.swift`);
    fs.writeFileSync(providerFilePath, providerSwift);
    return path.join(targetPath, 'Provider.swift');
};
const createIndexSwift = (widgets, targetPath) => {
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
const createWidgetSwift = (bundleIdentifier, widget, targetPath) => {
    const widgetFilePath = path.join(targetPath, `${widget.name}.swift`);
    fs.writeFileSync(widgetFilePath, widgetSwift(bundleIdentifier, widget));
    return widgetFilePath;
};
const addIndexSwiftChunk = (widgets, index, isLastChunk) => `
${index === 0 ? '@main' : ''}
struct ExportWidgets${index}: WidgetBundle {
  var body: some Widget {
    ${widgets.map((widget) => `${widget.name}()`).join('\n\t\t')}
    ${!isLastChunk ? `ExportWidgets${index + 1}().body` : `ExpoWidgets.WidgetLiveActivity()`}
  }
}`;
const widgetSwift = (bundleIdentifier, widget) => `
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
const infoPlist = (groupIdentifier) => `<?xml version="1.0" encoding="UTF-8"?>
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
exports.default = withWidgetSourceFiles;
