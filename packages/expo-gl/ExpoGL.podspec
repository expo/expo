require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name            = 'ExpoGL'
  s.version         = package['version']
  s.summary         = package['description']
  s.description     = package['description']
  s.license         = package['license']
  s.author          = package['author']
  s.homepage        = package['homepage']
  s.platforms       = {
    :ios => '16.4'
  }
  s.source          = { git: 'https://github.com/expo/expo-gl.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'ExpoModulesJSI'
  s.dependency 'ReactCommon/turbomodule/core'

  s.compiler_flags = '-x objective-c++ -std=c++20'
  pod_target_xcconfig = {
    'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) GLES_SILENCE_DEPRECATION=1'
  }

  header_search_paths = []
  if ENV['USE_FRAMEWORKS']
    header_search_paths.concat([
      # Transient dependencies
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-runtimescheduler/React_runtimescheduler.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers"',
    ].compact)
  end

  if !header_search_paths.empty?
    pod_target_xcconfig['HEADER_SEARCH_PATHS'] = '$(inherited) ' + header_search_paths.join(' ')
  end
  s.pod_target_xcconfig = pod_target_xcconfig

  if !$ExpoUseSources&.include?(package['name']) && ENV['EXPO_USE_SOURCE'].to_i == 0 && File.exist?("#{s.name}.xcframework") && Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.10.0')
    s.source_files = "ios/**/*.h"
    s.vendored_frameworks = "#{s.name}.xcframework"
  else
    s.source_files = "ios/**/*.{h,m,mm,swift}", "common/**/*.{h,cpp,def}"
  end

  s.public_header_files = ['ios/**/*.h', 'common/EXGLNativeApi.h']
end
