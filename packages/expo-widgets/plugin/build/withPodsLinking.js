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
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const withPodsLinking = (config, { targetName }) => (0, config_plugins_1.withDangerousMod)(config, [
    'ios',
    async (config) => {
        const podsFilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
        let podfileContent = fs.readFileSync(podsFilePath, 'utf8');
        if (podfileContent.includes(`target "${targetName}" do`)) {
            return config;
        }
        podfileContent += podfileExpoWidgetsLinking(targetName);
        fs.writeFileSync(podsFilePath, podfileContent, 'utf8');
        return config;
    },
]);
exports.default = withPodsLinking;
const podfileExpoWidgetsLinking = (targetName) => `
target "${targetName}" do
    require File.join(File.dirname(\`node --print "require.resolve('react-native/package.json')"\`), "scripts/react_native_pods")
    exclude = []
    use_expo_modules!(exclude: exclude)

    if ENV['EXPO_USE_COMMUNITY_AUTOLINKING'] == '1'
      config_command = ['node', '-e', "process.argv=['', '', 'config'];require('@react-native-community/cli').run()"];
    else
      config_command = [
        'node',
        '--no-warnings',
        '--eval',
        "require(require.resolve('expo-modules-autolinking', { paths: [require.resolve('expo/package.json')] }))(process.argv.slice(1))",
        'react-native-config',
        '--json',
        '--platform',
        'ios'
      ]
    end

    config = use_native_modules!(config_command)

    use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']
    use_frameworks! :linkage => ENV['USE_FRAMEWORKS'].to_sym if ENV['USE_FRAMEWORKS']

    use_react_native!(
      :path => config[:reactNativePath],
      :hermes_enabled => podfile_properties['expo.jsEngine'] == nil || podfile_properties['expo.jsEngine'] == 'hermes',
      :app_path => "#{Pod::Config.instance.installation_root}/..",
      :privacy_file_aggregation_enabled => podfile_properties['apple.privacyManifestAggregationEnabled'] != 'false',
    )
end
`;
