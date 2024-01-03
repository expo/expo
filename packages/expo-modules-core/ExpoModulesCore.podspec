require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

reactNativeVersion = '0.0.0'
begin
  reactNativeVersion = `node --print "require('react-native/package.json').version"`
rescue
  reactNativeVersion = '0.0.0'
end

reactNativeMinorVersion = reactNativeVersion.split('.')[1].to_i

fabric_enabled = ENV['RCT_NEW_ARCH_ENABLED'] == '1'
fabric_compiler_flags = '-DRN_FABRIC_ENABLED -DRCT_NEW_ARCH_ENABLED'
folly_version = '2022.05.16.00'
folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1 -Wno-comma -Wno-shorten-64-to-32'

Pod::Spec.new do |s|
  s.name           = 'ExpoModulesCore'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms       = {
    :ios => '13.4',
    :osx => '10.15',
    :tvos => '13.4'
  }
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.header_dir     = 'ExpoModulesCore'

  header_search_paths = [
    # EXJavaScriptRuntime -> Hermes
    '"$(PODS_ROOT)/boost"',
    '"$(PODS_ROOT)/DoubleConversion"',
    '"$(PODS_ROOT)/RCT-Folly"',
    '"${PODS_ROOT}/Headers/Public/React-hermes"',
    '"${PODS_ROOT}/Headers/Public/hermes-engine"',

    # EXAppDelegateWrapper -> RCTAppDelegate -> RCTCxxBridgeDelegate
    '"${PODS_ROOT}/Headers/Private/React-Core"',
  ]

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'USE_HEADERMAP' => 'YES',
    'DEFINES_MODULE' => 'YES',
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++20',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'HEADER_SEARCH_PATHS' => header_search_paths.join(' '),
    "FRAMEWORK_SEARCH_PATHS" => "\"${PODS_CONFIGURATION_BUILD_DIR}/React-hermes\"",
    'OTHER_SWIFT_FLAGS' => "$(inherited) #{fabric_enabled ? fabric_compiler_flags : ''}"
  }
  user_header_search_paths = [
    '"${PODS_CONFIGURATION_BUILD_DIR}/ExpoModulesCore/Swift Compatibility Header"',
    '"$(PODS_ROOT)/Headers/Private/React-bridging/react/bridging"',
    '"$(PODS_CONFIGURATION_BUILD_DIR)/React-bridging/react_bridging.framework/Headers"',
    '"$(PODS_ROOT)/Headers/Private/Yoga"',
  ]
  if fabric_enabled && ENV['USE_FRAMEWORKS']
    user_header_search_paths << "\"$(PODS_ROOT)/DoubleConversion\""
    user_header_search_paths << "\"${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers\""
    user_header_search_paths << "\"${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers/react/renderer/graphics/platform/ios\""
    user_header_search_paths << "\"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers\""
    user_header_search_paths << "\"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers\""
    user_header_search_paths << "\"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers/react/nativemodule/core\""
    user_header_search_paths << "\"${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric/RCTFabric.framework/Headers\""
  end
  s.user_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => user_header_search_paths,
  }

  compiler_flags = folly_compiler_flags + ' ' + "-DREACT_NATIVE_MINOR_VERSION=#{reactNativeMinorVersion}"

  s.dependency 'React-Core'
  s.dependency 'ReactCommon/turbomodule/core'
  s.dependency 'React-RCTAppDelegate' if reactNativeMinorVersion >= 71
  s.dependency 'React-NativeModulesApple' if reactNativeMinorVersion >= 72

  if fabric_enabled
    compiler_flags << ' ' << fabric_compiler_flags

    s.dependency 'React-RCTFabric'
    s.dependency 'RCT-Folly', folly_version
  end

  unless defined?(install_modules_dependencies)
    # `install_modules_dependencies` is defined from react_native_pods.rb.
    # when running with `pod ipc spec`, this method is not defined and we have to require manually.
    require File.join(File.dirname(`node --print "require.resolve('react-native/package.json')"`), "scripts/react_native_pods")
  end
  install_modules_dependencies(s)

  if !$ExpoUseSources&.include?(package['name']) && ENV['EXPO_USE_SOURCE'].to_i == 0 && File.exist?("ios/#{s.name}.xcframework") && Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.10.0')
    s.source_files = 'ios/**/*.h', 'common/cpp/**/*.h'
    s.vendored_frameworks = "ios/#{s.name}.xcframework"
  else
    s.source_files = 'ios/**/*.{h,m,mm,swift,cpp}', 'common/cpp/**/*.{h,cpp}'
  end

  exclude_files = ['ios/Tests/']
  if !fabric_enabled
    exclude_files.append('ios/Fabric/')
    exclude_files.append('common/cpp/fabric/')
  end

  s.exclude_files = exclude_files
  s.compiler_flags = compiler_flags
  s.private_header_files = ['ios/**/*+Private.h', 'ios/**/Swift.h']

  s.test_spec 'Tests' do |test_spec|
    test_spec.dependency 'ExpoModulesTestCore'

    test_spec.source_files = 'ios/Tests/**/*.{m,swift}'
  end
end
