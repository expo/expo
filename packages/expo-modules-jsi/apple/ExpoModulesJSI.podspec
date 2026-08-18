require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

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
    :osx => '13.4',
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
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsinspector/jsinspector_modern.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsinspectortracing/jsinspector_moderntracing.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsinspectorcdp/jsinspector_moderncdp.framework/Headers"',
      # Transitive dependencies of React-runtimescheduler
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-runtimescheduler/React_runtimescheduler.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-utils/React_utils.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsitooling/JSITooling.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-performancetimeline/React_performancetimeline.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-rendererconsistency/React_rendererconsistency.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-timing/React_timing.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-debug/React_debug.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/RCT-Folly/folly.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/fmt/fmt.framework/Headers"',
      '"$(PODS_ROOT)/DoubleConversion"',
    ])
  end

  s.pod_target_xcconfig = {
    'USE_HEADERMAP' => 'YES',
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => header_search_paths.join(' '),
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++20',
    'FRAMEWORK_SEARCH_PATHS' => '"${PODS_CONFIGURATION_BUILD_DIR}/XCFrameworkIntermediates/ExpoModulesJSI"',
  }

  s.dependency 'React-Core'
  s.dependency 'ReactCommon'

  # Create a stub xcframework if needed, so CocoaPods generates the
  # "[CP] Copy XCFrameworks" and "[CP] Embed Pods Frameworks" build phases.
  # This is only a fallback — CocoaPods skips prepare_command when the podspec
  # hasn't changed (e.g. CI cache hit). The primary path is
  # ensure_expo_modules_jsi_stub_xcframework in expo-modules-autolinking.
  s.prepare_command = './scripts/create-stub-xcframework.sh'

  s.vendored_frameworks = ["Products/#{s.name}.xcframework"]

  s.script_phase = {
    :name => "Build #{s.name} xcframework",
    :script => '"${PODS_TARGET_SRCROOT}/scripts/build-xcframework.sh"',
    :execution_position => :before_headers,
    # Ensure the script runs on every build so its internal
    # hash-based caching can decide whether to rebuild.
    :always_out_of_date => "1",
  }

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'Tests/**/*.swift'
    test_spec.pod_target_xcconfig = {
      # `UIUtilities.framework` is a private Apple sub-framework auto-linked by Swift Testing
      # / SwiftUI helpers. Its path is not in the default framework search paths for test
      # targets, so we add it explicitly here.
      'FRAMEWORK_SEARCH_PATHS' => '$(inherited) "$(SDKROOT)/System/Library/SubFrameworks"',
      # Swift/C++ interop requires explicit linkage to libc++ for C++ exception handling
      # (resolves the `___gxx_personality_v0` linker error).
      'OTHER_LDFLAGS' => '$(inherited) -lc++',
    }
  end
end
