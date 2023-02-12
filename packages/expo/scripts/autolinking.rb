require 'json'
require 'pathname'
require 'colored2' # dependency of CocoaPods

require File.join(File.dirname(`node --print "require.resolve('expo-modules-autolinking/package.json')"`), "scripts/ios/autolinking_manager")
require File.join(File.dirname(`node --print "require.resolve('expo-modules-autolinking/package.json')"`), "scripts/ios/xcode_env_generator")
require File.join(File.dirname(`node --print "require.resolve('expo-modules-autolinking/package.json')"`), "scripts/ios/react_import_patcher")

def use_expo_modules!(options = {})
  # When run from the Podfile, `self` points to Pod::Podfile object

  if @current_target_definition.autolinking_manager.present?
    Pod::UI.message 'Expo modules are already being used in this target definition'.red
    return
  end

  @current_target_definition.autolinking_manager = Expo::AutolinkingManager.new(self, @current_target_definition, options).use_expo_modules!

  maybe_generate_xcode_env_file!()
end

def use_expo_modules_tests!(options = {})
  use_expo_modules!({ testsOnly: true }.merge(options))
end

def expo_patch_react_imports!(installer, options = {})
  unless installer.is_a?(Pod::Installer)
    Pod::UI.warn 'expo_patch_react_imports!() - Invalid `installer` parameter'.red
    return
  end

  Expo::ReactImportPatcher.new(installer, options).run!
end
