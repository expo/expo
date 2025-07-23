require 'json'
require 'colored2' # dependency of CocoaPods


absolute_react_native_path = ''
if !ENV['REACT_NATIVE_PATH'].nil?
  absolute_react_native_path = File.expand_path(ENV['REACT_NATIVE_PATH'], Pod::Config.instance.project_root)
else
  absolute_react_native_path = File.dirname(`node --print "require.resolve('react-native/package.json')"`)
end

reactNativeVersion = '0.0.0'
begin
  reactNativeVersion = `node --print "require('#{absolute_react_native_path}/package.json').version"`
  rescue
  reactNativeVersion = '0.0.0'
end

reactNativeTargetVersion = reactNativeVersion.split('.')[1].to_i

compiler_flags = get_folly_config()[:compiler_flags]

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

# Use a global flag to check whether the warning about missing autolinking
# scripts has already been printed. The podspec may be read multiple times
# during `pod install` and we don't want to make the warning more obtrusive.
$expo_warned_about_missing_autolinking |= false

Pod::Spec.new do |s|
  s.name           = 'Expo'
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
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.header_dir     = 'Expo'

  # Don't require the `ExpoModulesCore` dependency if the autolinking hasn't been imported.
  # Otherwise, `pod install` would fail because it's not linkable by the community CLI.
  if defined?(use_expo_modules!)
    s.dependency 'ExpoModulesCore'
  elsif !$expo_warned_about_missing_autolinking
    puts <<~EOS

    Your project includes the Expo package, but React Native Community CLI is unable to install the related Pods.
    Make sure to require autolinking scripts from Expo and call `use_expo_modules!` in your target.
    Learn more: https://docs.expo.dev/bare/installing-expo-modules
    EOS
    .yellow

    # Suppress the warning next time.
    $expo_warned_about_missing_autolinking = true
  end

  header_search_paths = [
    '"$(PODS_ROOT)/Headers/Private/React-Core"', # as React-RCTAppDelegate.podspec to access JSCExecutorFactory.h
    '"$(PODS_ROOT)/DoubleConversion"',
    '"${PODS_CONFIGURATION_BUILD_DIR}/ExpoModulesCore/Swift Compatibility Header"',
  ]
  if ENV['USE_FRAMEWORKS']
    header_search_paths.concat([
      # [begin] transitive dependencies of React-RCTAppDelegate that are not defined modules
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-RuntimeApple/React_RuntimeApple.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-RuntimeCore/React_RuntimeCore.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jserrorhandler/React_jserrorhandler.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsinspector/jsinspector_modern.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsinspectortracing/jsinspector_moderntracing.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsinspectorcdp/jsinspector_moderncdp.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsitooling/JSITooling.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-runtimescheduler/React_runtimescheduler.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-performancetimeline/React_performancetimeline.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-rendererconsistency/React_rendererconsistency.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/RCT-Folly/folly.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/fmt/fmt.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-utils/React_utils.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-debug/React_debug.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-rendererdebug/React_rendererdebug.framework/Headers"',
      # [end] transitive dependencies of React-RCTAppDelegate that are not defined modules
    ])
  end
  s.pod_target_xcconfig = {
    'HEADER_SEARCH_PATHS' => header_search_paths.join(' '),
  }
  s.user_target_xcconfig = {
    'HEADER_SEARCH_PATHS' => [
      '"${PODS_CONFIGURATION_BUILD_DIR}/Expo/Swift Compatibility Header"',
      '"$(PODS_ROOT)/Headers/Private/Yoga"',
    ]
  }

  s.dependency 'React-RCTAppDelegate'
  s.dependency 'React-RCTFabric'
  s.dependency 'ReactAppDependencyProvider'

  install_modules_dependencies(s)

  s.source_files = 'ios/**/*.{h,m,mm,swift}'
  s.compiler_flags = compiler_flags
  s.private_header_files = ['ios/**/Swift.h']
end
