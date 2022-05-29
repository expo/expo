require 'json'
require 'pathname'
require 'colored2' # dependency of CocoaPods

require File.join(File.dirname(`node --print "require.resolve('expo-modules-autolinking/package.json')"`), "scripts/ios/autolinking_manager")
require File.join(File.dirname(`node --print "require.resolve('expo-modules-autolinking/package.json')"`), "scripts/ios/react_import_patcher")

def use_expo_modules!(options = {})
  # When run from the Podfile, `self` points to Pod::Podfile object

  if @current_target_definition.autolinking_manager.present?
    Pod::UI.message 'Expo modules are already being used in this target definition'.red
    return
  end

  @current_target_definition.autolinking_manager = Expo::AutolinkingManager.new(self, @current_target_definition, options).use_expo_modules!
end

def expo_patch_react_imports!(installer, options = {})
  unless installer.is_a?(Pod::Installer)
    Pod::UI.warn 'expo_patch_react_imports!() - Invalid `installer` parameter'.red
    return
  end

  Expo::ReactImportPatcher.new(installer, options).run!
end

def expo_post_install(installer, options = {})
  # If we want to run expo-dev-launcher packager, set EX_DEV_LAUNCHER_URL to its base URL (e.g. http://localhost:8090),
  # and the iOS build will pick it up here.
  dev_launcher_url = ENV['EX_DEV_LAUNCHER_URL'] || ""
  if dev_launcher_url != ""
    installer.pods_project.targets.each do |target|
      if target.name == 'expo-dev-launcher'
        target.build_configurations.each do |config|
          if config.name == 'Debug'
            config.build_settings['OTHER_CFLAGS'] = "$(inherited) -DEX_DEV_LAUNCHER_URL=\'\\\"" + dev_launcher_url + "\\\"\'"
          end
        end
      end
    end
  end
end
