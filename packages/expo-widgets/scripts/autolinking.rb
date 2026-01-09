require 'json'
require 'pathname'
require 'colored2' # dependency of CocoaPods

require File.join(File.dirname(`node --print "require.resolve('expo-modules-autolinking/package.json', { paths: ['#{__dir__}'] })"`), "scripts/ios/autolinking_manager")
require File.join(File.dirname(`node --print "require.resolve('react-native/package.json')"`), "scripts/react_native_pods")

def use_expo_modules_widgets!(options = {})
  output = Expo::AutolinkingManager.new(self, @current_target_definition, options).resolve

  all_packages = output["modules"].map { |mod| mod["packageName"] }
  used_packages = ["expo", "expo-widgets", "@expo/ui"]
  packages_to_exclude = all_packages - used_packages

  options[:exclude] = packages_to_exclude
  use_expo_modules!(options)
end

def use_expo_native_module!(config_command = $default_command)
  config = list_native_modules!(config_command)
  config[:ios_packages].select! { |package| package[:name] == "expo" }

  return link_native_modules!(config)
end
