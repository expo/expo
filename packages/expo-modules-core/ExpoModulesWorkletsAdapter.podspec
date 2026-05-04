require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

unless Pod.respond_to?(:reactNativeWorkletsPath)
  def Pod::reactNativeWorkletsPath()
    config = Pod::Config.instance
    podfile = config.instance_variable_get(:@podfile) if config.instance_variable_defined?(:@podfile)
    rn_worklets_dep = podfile&.dependencies&.find { |dep| dep.name == 'RNWorklets' }
    rn_worklets_path = rn_worklets_dep&.external_source&.dig(:path)
    return File.expand_path(rn_worklets_path, config.installation_root.to_s) if rn_worklets_path

    project_root = ENV['PROJECT_ROOT'] || config.installation_root.to_s
    package_json_path = `node --print "require.resolve('react-native-worklets/package.json', { paths: ['#{__dir__}', '#{project_root}'] })" 2>/dev/null`.strip
    return nil if package_json_path.empty?

    File.dirname(package_json_path)
  rescue
    nil
  end
end

Pod::Spec.new do |s|
  s.name           = 'ExpoModulesWorkletsAdapter'
  s.version        = package['version']
  s.summary        = 'Companion pod for ExpoModulesWorklets — links the runtime worklets:: bridge when react-native-worklets is installed.'
  s.description    = s.summary
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
  s.header_dir     = 'ExpoModulesWorkletsAdapter'

  s.dependency 'ExpoModulesJSI'
  s.dependency 'ExpoModulesCore'
  s.dependency 'ExpoModulesWorklets'
  s.dependency 'RNWorklets'

  header_search_paths = []
  if ENV['USE_FRAMEWORKS']
    header_search_paths.concat([
      # Transitive dependency of React-Core
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsinspector/jsinspector_modern.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsinspectortracing/jsinspector_moderntracing.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsinspectorcdp/jsinspector_moderncdp.framework/Headers"',
      # Transitive dependencies of React-runtimescheduler
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-runtimescheduler/React_runtimescheduler.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers"',
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

  react_native_worklets_dir_absolute = Pod::reactNativeWorkletsPath()

  if react_native_worklets_dir_absolute.nil?
    raise <<~MSG.strip
      [ExpoModulesWorkletsAdapter] Could not locate the `react-native-worklets` package.

      The adapter needs the worklets headers and sources to compile, but `require.resolve('react-native-worklets/package.json')` returned nothing from `#{__dir__}` or `#{ENV['PROJECT_ROOT'] || Pod::Config.instance.installation_root}`, and the `RNWorklets` Podfile dependency did not declare a `:path`.

      Fix by either installing `react-native-worklets` so it resolves from your project root, or declaring `pod 'RNWorklets', :path => '<path-to-package>'` in your Podfile.
    MSG
  end

  pods_root = Pod::Config.instance.project_pods_root
  workletsPath = Pathname.new(react_native_worklets_dir_absolute).relative_path_from(pods_root).to_s

  header_search_paths.concat([
    "\"$(PODS_ROOT)/#{workletsPath}/apple\"",
    "\"$(PODS_ROOT)/#{workletsPath}/Common/cpp\"",
    # Reach the private headers of `ExpoModulesWorklets` (e.g.
    # `EXWorkletsProvider+Private.h`) from this companion pod.
    '"$(PODS_ROOT)/Headers/Private/ExpoModulesWorklets"',
  ])

  s.pod_target_xcconfig = {
    'USE_HEADERMAP' => 'YES',
    'DEFINES_MODULE' => 'YES',
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++20',
    'HEADER_SEARCH_PATHS' => header_search_paths.join(' '),
  }

  s.source_files = 'ios/WorkletsAdapter/**/*.{h,m,mm}'
end
