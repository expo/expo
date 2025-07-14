require 'json'

absolute_react_native_path = ''
if !ENV['REACT_NATIVE_PATH'].nil?
  absolute_react_native_path = File.expand_path(ENV['REACT_NATIVE_PATH'], Pod::Config.instance.project_root)
else
  absolute_react_native_path = File.dirname(`node --print "require.resolve('react-native/package.json')"`)
end

unless defined?(install_modules_dependencies)
  # `install_modules_dependencies` and `add_dependency` are defined in react_native_pods.rb.
  # When running with `pod ipc spec`, these methods are not defined and we have to require manually.
  require File.join(absolute_react_native_path, "scripts/react_native_pods")
end

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

reactNativeVersion = '0.0.0'
begin
  reactNativeVersion = `node --print "require('#{absolute_react_native_path}/package.json').version"`
rescue
  reactNativeVersion = '0.0.0'
end

reactNativeTargetVersion = reactNativeVersion.split('.')[1].to_i

use_hermes = ENV['USE_HERMES'] == nil || ENV['USE_HERMES'] == '1'
new_arch_enabled = ENV['RCT_NEW_ARCH_ENABLED'] == '1'
new_arch_compiler_flags = '-DRCT_NEW_ARCH_ENABLED'
compiler_flags = get_folly_config()[:compiler_flags] + ' ' + "-DREACT_NATIVE_TARGET_VERSION=#{reactNativeTargetVersion}"

if use_hermes
  compiler_flags << ' -DUSE_HERMES'
end
if new_arch_enabled
  compiler_flags << ' ' << new_arch_compiler_flags
end

# List of features that are required by linked modules
coreFeatures = []
if defined?(Expo::PackagesConfig)
  coreFeatures = Expo::PackagesConfig.instance.coreFeatures
end

Pod::Spec.new do |s|
  s.name           = 'ExpoModulesCore'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms       = {
    :ios => '15.1',
    :osx => '11.0',
    :tvos => '15.1'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.header_dir     = 'ExpoModulesCore'

  header_search_paths = []
  if ENV['USE_FRAMEWORKS']
    header_search_paths.concat([
      # Transitive dependency of React-Core
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsinspectortracing/jsinspector_moderntracing.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsinspectorcdp/jsinspector_moderncdp.framework/Headers"'
    ])
  end
  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'USE_HEADERMAP' => 'YES',
    'DEFINES_MODULE' => 'YES',
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++20',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'OTHER_SWIFT_FLAGS' => "$(inherited) #{new_arch_enabled ? new_arch_compiler_flags : ''}",
    'HEADER_SEARCH_PATHS' => header_search_paths.join(' '),
    'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) EXPO_MODULES_CORE_VERSION=' + package['version'],
  }
  s.user_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => [
      '"${PODS_CONFIGURATION_BUILD_DIR}/ExpoModulesCore/Swift Compatibility Header"',
      '"$(PODS_ROOT)/Headers/Private/Yoga"', # Expo.h -> ExpoModulesCore-umbrella.h -> Fabric ViewProps.h -> Private Yoga headers
    ],
  }

  if use_hermes
    s.dependency 'hermes-engine'
    add_dependency(s, "React-jsinspector", :framework_name => 'jsinspector_modern')
  else
    s.dependency 'React-jsc'
  end

  s.dependency 'React-Core'
  s.dependency 'ReactCommon/turbomodule/core'
  s.dependency 'React-NativeModulesApple'
  s.dependency 'React-RCTFabric'

  install_modules_dependencies(s)

  s.source_files = 'ios/**/*.{h,m,mm,swift,cpp}', 'common/cpp/**/*.{h,cpp}'
  s.exclude_files = ['ios/Tests/']
  s.compiler_flags = compiler_flags
  s.private_header_files = ['ios/**/*+Private.h', 'ios/**/Swift.h']

  s.test_spec 'Tests' do |test_spec|
    test_spec.dependency 'ExpoModulesTestCore'

    test_spec.source_files = 'ios/Tests/**/*.{m,swift}'
  end
end
