require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

reactNativeVersion = '0.0.0'
begin
  absolute_react_native_path = ''
  if !ENV['REACT_NATIVE_PATH'].nil?
    absolute_react_native_path = File.expand_path(ENV['REACT_NATIVE_PATH'], Pod::Config.instance.project_root)
  else
    absolute_react_native_path = File.dirname(`node --print "require.resolve('react-native/package.json')"`)
  end
  reactNativeVersion = `node --print "require('#{absolute_react_native_path}/package.json').version"`
rescue
  reactNativeVersion = '0.0.0'
end

reactNativeTargetVersion = reactNativeVersion.split('.')[1].to_i

# During resolution phase, it will always false as Pod::Config.instance.podfile is not yet set.
# However, for our use case, we only need to check this value during installation phase.
unless Pod.respond_to?(:hasWorklets)
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
end

shouldEnableWorkletsIntegration = hasWorklets()
workletsCppFlags = 'WORKLETS_ENABLED=0'
if shouldEnableWorkletsIntegration
  workletsCppFlags = "WORKLETS_ENABLED=1 REACT_NATIVE_MINOR_VERSION=#{reactNativeTargetVersion}"
end

Pod::Spec.new do |s|
  s.name           = 'ExpoModulesWorklets'
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
  s.header_dir     = 'ExpoModulesWorklets'

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

  if shouldEnableWorkletsIntegration
    rn_worklets_dep = Pod::Config.instance.podfile.dependencies.find { |dep| dep.name == 'RNWorklets' }
    rn_worklets_path = rn_worklets_dep&.external_source&.dig(:path)
    react_native_worklets_dir_absolute = if rn_worklets_path
      File.expand_path(rn_worklets_path, Pod::Config.instance.installation_root.to_s)
    else
      project_root = ENV['PROJECT_ROOT'] || Pod::Config.instance.installation_root.to_s
      File.dirname(`node --print "require.resolve('react-native-worklets/package.json', { paths: ['#{__dir__}', '#{project_root}'] })"`)
    end

    pods_root = Pod::Config.instance.project_pods_root
    workletsPath = Pathname.new(react_native_worklets_dir_absolute).relative_path_from(pods_root).to_s

    header_search_paths.concat([
      "\"$(PODS_ROOT)/#{workletsPath}/apple\"",
      "\"$(PODS_ROOT)/#{workletsPath}/Common/cpp\"",
    ])
  end

  s.pod_target_xcconfig = {
    'USE_HEADERMAP' => 'YES',
    'DEFINES_MODULE' => 'YES',
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++20',
    'HEADER_SEARCH_PATHS' => header_search_paths.join(' '),
    'GCC_PREPROCESSOR_DEFINITIONS' => "$(inherited) #{workletsCppFlags}",
  }

  s.dependency 'ExpoModulesJSI'
  s.dependency 'ExpoModulesCore'

  if shouldEnableWorkletsIntegration
    s.dependency 'RNWorklets'
  end

  s.source_files = 'ios/Worklets/**/*.{h,m,mm,swift,cpp}'
  s.private_header_files = 'ios/Worklets/**/*+Private.h'
end
