require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

use_hermes = ENV['USE_HERMES'] == nil || ENV['USE_HERMES'] == '1'

Pod::Spec.new do |s|
  s.name           = 'ExpoModulesJSI'
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
  s.header_dir     = 'ExpoModulesJSI'

  header_search_paths = []
  if ENV['USE_FRAMEWORKS']
    header_search_paths.concat([
      # Transitive dependency of React-Core
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsinspectortracing/jsinspector_moderntracing.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsinspectorcdp/jsinspector_moderncdp.framework/Headers"',
      # Transitive dependencies of React-runtimescheduler
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-runtimescheduler/React_runtimescheduler.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-performancetimeline/React_performancetimeline.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-rendererconsistency/React_rendererconsistency.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-timing/React_timing.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-debug/React_debug.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/RCT-Folly/folly.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/fmt/fmt.framework/Headers"',
      '"$(PODS_ROOT)/DoubleConversion"',
    ])
  end

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'USE_HEADERMAP' => 'YES',
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => header_search_paths.join(' '),
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++20',
    'GCC_PREPROCESSOR_DEFINITIONS' => 'EXPO_MODULES_JSI=1'
  }

  s.dependency 'hermes-engine'
  s.dependency 'React-Core'
  s.dependency 'ReactCommon'
  s.dependency 'React-runtimescheduler'

  if File.exist?("#{s.name}.xcframework")
    s.source_files = [
      "JSI/**/*.{h,hpp}",
      "JSI/JavaScriptRuntimeProvider.{h,mm}"
    ]
    s.vendored_frameworks = ["#{s.name}.xcframework"]
  else
    s.source_files = ['JSI/**/*.{h,m,mm,swift,hpp,cpp}']
  end

  s.exclude_files = ['JSI/Tests']

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'Tests/**/*.swift'
  end
end
