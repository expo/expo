require 'json'
require 'open3'
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

def expo_get_config(field, options = {})
  project_root = options[:project_root] || '..'
  node_statement = "require('@expo/config').getConfig('#{project_root}').exp.#{field}"
  node_command = options[:json] ?
    "node --print \"JSON.stringify(#{node_statement} ?? null)\"" :
    "node --print \"(#{node_statement} ?? '')\""

  stdout, stderr, _ = Open3.capture3(node_command)
  unless stderr.empty?
    Pod::UI.warn "expo_get_config() Execution failed - node_command[#{node_command}]\n" + stderr
    return nil
  end
  config = stdout.strip
  Pod::UI.message "expo_get_config() - Execution - node_command[#{node_command}] result[#{config}]"

  if options[:json]
    return JSON.parse(config)
  end
  return config.empty? ? nil : config
end
