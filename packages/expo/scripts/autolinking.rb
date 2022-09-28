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
  expo_patch_for_updates_debug!(installer)
end

def expo_patch_for_updates_debug!(installer)
  projects = installer.aggregate_targets
    .map { |t| t.user_project }
    .uniq { |p| p.path }
    .push(installer.pods_project)

  ex_updates_native_debug = ENV['EX_UPDATES_NATIVE_DEBUG'] == '1'

  projects.each do |project|
    project.build_configurations.each do |config|
      if ex_updates_native_debug
        config.build_settings['OTHER_CFLAGS'] = "$(inherited) -DEX_UPDATES_NATIVE_DEBUG=1"
      else
        config.build_settings['OTHER_CFLAGS'] = "$(inherited)"
      end
    end
    project.save()
  end
end
