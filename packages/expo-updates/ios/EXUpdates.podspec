require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

use_dev_client = false
begin
  use_dev_client = `node --print "require('expo-dev-client/package.json').version" 2>/dev/null`.length > 0
rescue
  use_dev_client = false
end

Pod::Spec.new do |s|
  s.name           = 'EXUpdates'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '13.4', :tvos => '13.4' }
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.dependency 'React-Core'
  s.dependency 'EXStructuredHeaders'
  s.dependency 'EXUpdatesInterface'
  s.dependency 'EXManifests'
  s.dependency 'EASClient'
  s.dependency 'ReachabilitySwift'
  s.dependency 'sqlite3', '~> 3.45.3+1'

  unless defined?(install_modules_dependencies)
    # `install_modules_dependencies` is defined from react_native_pods.rb.
    # when running with `pod ipc spec`, this method is not defined and we have to require manually.
    require File.join(File.dirname(`node --print "require.resolve('react-native/package.json')"`), "scripts/react_native_pods")
  end
  install_modules_dependencies(s)

  other_c_flags = '$(inherited)'
  other_swift_flags = '$(inherited)'

  ex_updates_native_debug = ENV['EX_UPDATES_NATIVE_DEBUG'] == '1'
  if ex_updates_native_debug
    other_c_flags << ' -DEX_UPDATES_NATIVE_DEBUG=1'
    other_swift_flags << ' -DEX_UPDATES_NATIVE_DEBUG'
  end
  if use_dev_client
    other_c_flags << ' -DUSE_DEV_CLIENT=1'
    other_swift_flags << ' -DUSE_DEV_CLIENT'
  end

  s.pod_target_xcconfig = {
    'GCC_TREAT_INCOMPATIBLE_POINTER_TYPE_WARNINGS_AS_ERRORS' => 'YES',
    'GCC_TREAT_IMPLICIT_FUNCTION_DECLARATIONS_AS_ERRORS' => 'YES',
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'OTHER_CFLAGS[config=Debug]' => other_c_flags,
    'OTHER_SWIFT_FLAGS[config=Debug]' => other_swift_flags
  }
  s.user_target_xcconfig = {
    'HEADER_SEARCH_PATHS' => '"${PODS_CONFIGURATION_BUILD_DIR}/EXUpdates/Swift Compatibility Header"',
  }

  if !ex_updates_native_debug && !$ExpoUseSources&.include?(package['name']) && ENV['EXPO_USE_SOURCE'].to_i == 0 && File.exist?("#{s.name}.xcframework") && Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.10.0')
    s.source_files = "#{s.name}/**/*.h"
    s.vendored_frameworks = "#{s.name}.xcframework"
  else
    s.source_files = "#{s.name}/**/*.{h,m,swift}"
  end

  if $expo_updates_create_updates_resources != false
    force_bundling_flag = ex_updates_native_debug ? "export FORCE_BUNDLING=1\n" : ""
    s.script_phase = {
      :name => 'Generate updates resources for expo-updates',
      :script => force_bundling_flag + 'bash -l -c "$PODS_TARGET_SRCROOT/../scripts/create-updates-resources-ios.sh"',
      :execution_position => :before_compile
    }

    # Generate EXUpdates.bundle without existing resources
    # `create-updates-resources-ios.sh` will generate updates resources in EXUpdates.bundle
    s.resource_bundles = {
      'EXUpdates' => []
    }
  end

  s.exclude_files = 'Tests/'
  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'Tests/*.{h,m,swift}'
    test_spec.resources = 'Tests/Support/**/*'

    # ExpoModulesCore requires React-hermes or React-jsc in tests, add ExpoModulesTestCore for the underlying dependencies
    test_spec.dependency 'ExpoModulesTestCore'

    test_spec.pod_target_xcconfig = {
      'USER_HEADER_SEARCH_PATHS' => '"${CONFIGURATION_TEMP_DIR}/EXUpdates.build/DerivedSources"',
      'GCC_TREAT_INCOMPATIBLE_POINTER_TYPE_WARNINGS_AS_ERRORS' => 'YES',
      'GCC_TREAT_IMPLICIT_FUNCTION_DECLARATIONS_AS_ERRORS' => 'YES',
      'DEFINES_MODULE' => 'YES',
      'SWIFT_COMPILATION_MODE' => 'wholemodule'
    }
  end
end
