require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

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
    :ios => '15.1',
    :osx => '11.0',
    :tvos => '15.1'
  }
  s.swift_version    = '6.0'
  s.source           = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  if use_hermes
    s.dependency 'hermes-engine'
  else
    s.dependency 'React-jsc'
  end

  s.dependency 'React-Core'
  s.dependency 'ReactCommon'
  s.dependency 'React-runtimescheduler'

  # Check that ExpoModulesCore.xcframework actually exists (ExpoModulesJSI headers are bundled inside it).
  # Using has_prebuilt_xcframework? ensures we fall back to source build when xcframeworks are missing,
  # even if EXPO_USE_PRECOMPILED_MODULES=1 is set.
  should_use_prebuilt = defined?(Expo::PrecompiledModules) && Expo::PrecompiledModules.has_prebuilt_xcframework?('ExpoModulesCore')
  if (should_use_prebuilt)
    # TODO(ExpoModulesJSI-xcframework): When ExpoModulesJSI.xcframework is built separately,
    # replace this section with:
    #   s.vendored_frameworks = "xcframeworks/debug/ExpoModulesJSI.xcframework"
    # and remove the configure_header_search_paths workaround in precompiled_modules.rb
    #
    # Currently, ExpoModulesJSI headers are bundled inside ExpoModulesCore.xcframework.
    # Header search paths are configured globally in the post_install hook via
    # Expo::PrecompiledModules.configure_header_search_paths.
    s.source_files = "dummy.c"

    s.pod_target_xcconfig = {
      'DEFINES_MODULE' => 'YES',
    }
  else
    s.header_dir     = 'ExpoModulesJSI'

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
        '"${PODS_CONFIGURATION_BUILD_DIR}/fmt/fmt.framework/Headers"',
        '"$(PODS_ROOT)/DoubleConversion"',
      ])
    end

    # Build from sources
    s.source_files = ['ios/JSI/**/*.{h,m,mm,swift,cpp}', 'common/cpp/JSI/**/*.{h,cpp}']
    s.exclude_files = ['ios/JSI/Tests']
    s.private_header_files = ['ios/JSI/**/*+Private.h', 'ios/JSI/**/Swift.h']
    # Swift/Objective-C compatibility
    s.pod_target_xcconfig = {
      'USE_HEADERMAP' => 'YES',
      'DEFINES_MODULE' => 'YES',
      'HEADER_SEARCH_PATHS' => header_search_paths.join(' '),
    }
  end

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'ios/JSI/Tests/**/*.{m,swift}'
  end
end
