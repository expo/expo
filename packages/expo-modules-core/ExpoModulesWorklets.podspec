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
    :ios => '15.1',
    :osx => '11.0',
    :tvos => '15.1'
  }
  s.swift_version  = '6.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.header_dir     = 'ExpoModulesWorklets'

  header_search_paths = []
  if ENV['USE_FRAMEWORKS']
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
