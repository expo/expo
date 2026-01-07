import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

interface PodsLinkingProps {
  targetName: string;
}

const withPodsLinking: ConfigPlugin<PodsLinkingProps> = (config, { targetName }) =>
  withDangerousMod(config, [
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

export default withPodsLinking;

const podfileExpoWidgetsLinking = (targetName: string) => `
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
