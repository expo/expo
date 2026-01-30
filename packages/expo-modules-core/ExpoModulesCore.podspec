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

# During resolution phase, it will always false as Pod::Config.instance.podfile is not yet set.
# However, for our use case, we only need to check this value during installation phase.
def Pod::hasWorklets()
  begin
    # Safely access Pod::Config.instance.podfile without initiating it
    if Pod::Config.instance_variable_defined?(:@instance) && !Pod::Config.instance_variable_get(:@instance).nil?
      config = Pod::Config.instance

      # Saefly access podfile and its dependencies
      if config.instance_variable_defined?(:@podfile)
        podfile = config.instance_variable_get(:@podfile)
        if podfile && podfile.respond_to?(:dependencies)
          dependencies = podfile.dependencies.map(&:name)
          return dependencies.include?('RNWorklets')
        end
      end
    end
  rescue
  end
  return false
end

shouldEnableWorkletsIntegration = hasWorklets()
workletsCppFlags = 'WORKLETS_ENABLED=0'
if shouldEnableWorkletsIntegration
  workletsCppFlags = "WORKLETS_ENABLED=1 REACT_NATIVE_MINOR_VERSION=#{reactNativeTargetVersion}"
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
    :ios => '16.4',
    :osx => '12.0',
    :tvos => '16.4'
  }
  s.swift_version  = '6.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.header_dir     = 'ExpoModulesCore'

  header_search_paths = []
  if ENV['USE_FRAMEWORKS']
    header_search_paths.concat([
      # Transitive dependency of React-Core
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsinspectortracing/jsinspector_moderntracing.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsinspectorcdp/jsinspector_moderncdp.framework/Headers"',
      # Transitive dependencies of React-runtimescheduler
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-runtimescheduler/React_runtimescheduler.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-performancetimeline/React_performancetimeline.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-rendererconsistency/React_rendererconsistency.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-timing/React_timing.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-debug/React_debug.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/RCT-Folly/folly.framework/Headers"',
      '"$(PODS_ROOT)/DoubleConversion"', # Folly includes double-conversion/double-conversion.h
      # RCTHost.h is in React-RuntimeApple under ReactCommon subdirectory
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-RuntimeApple/React_RuntimeApple.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-RuntimeCore/React_RuntimeCore.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsitooling/JSITooling.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jserrorhandler/React_jserrorhandler.framework/Headers"',
    ])

    if shouldEnableWorkletsIntegration
      pods_root = Pod::Config.instance.project_pods_root
      react_native_worklets_node_modules_dir = File.join(File.dirname(`cd "#{Pod::Config.instance.installation_root.to_s}" && node --print "require.resolve('react-native-worklets/package.json')"`), '..')
      react_native_worklets_dir_absolute = File.join(react_native_worklets_node_modules_dir, 'react-native-worklets')
      workletsPath = Pathname.new(react_native_worklets_dir_absolute).relative_path_from(pods_root).to_s

      header_search_paths.concat([
        "\"$(PODS_ROOT)/#{workletsPath}/apple\"",
        "\"$(PODS_ROOT)/#{workletsPath}/Common/cpp\"",
      ])
    end
  end

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'USE_HEADERMAP' => 'YES',
    'DEFINES_MODULE' => 'YES',
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++20',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'OTHER_SWIFT_FLAGS' => "$(inherited) #{new_arch_enabled ? new_arch_compiler_flags : ''} -Xfrontend -clang-header-expose-decls=has-expose-attr",
    'HEADER_SEARCH_PATHS' => header_search_paths.join(' '),
    'GCC_PREPROCESSOR_DEFINITIONS' => "$(inherited) #{workletsCppFlags} EXPO_MODULES_CORE_VERSION=" + package['version'],
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

  s.dependency 'ExpoModulesJSI'

  s.dependency 'React-Core'
  s.dependency 'ReactCommon/turbomodule/core'
  s.dependency 'React-NativeModulesApple'
  s.dependency 'React-RCTFabric'

  if shouldEnableWorkletsIntegration
    s.dependency 'RNWorklets'
  end

  install_modules_dependencies(s)

  s.source_files = 'ios/**/*.{h,m,mm,swift,cpp}', 'common/cpp/**/*.{h,cpp}'
  s.exclude_files = ['ios/JSI', 'ios/Tests', 'common/cpp/JSI']
  s.compiler_flags = compiler_flags
  s.private_header_files = ['ios/**/*+Private.h', 'ios/**/Swift.h', 'ios/**/SwiftUIViewProps.h', 'common/**/fabric/*.h']

  s.test_spec 'Tests' do |test_spec|
    test_spec.dependency 'ExpoModulesTestCore'

    test_spec.source_files = 'ios/Tests/**/*.{m,swift}'
  end
end
