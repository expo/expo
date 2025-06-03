require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name            = 'ExpoHead'
  s.version         = package['version']
  s.summary         = package['description']
  s.description     = package['description']
  s.license         = package['license']
  s.author          = package['author']
  s.homepage        = package['homepage']
  s.platforms       = {
    :ios => '15.1'
  }
  s.source          = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'ReactCommon/turbomodule/core'

  s.compiler_flags = '-x objective-c++ -std=c++20'
  s.pod_target_xcconfig = {
    'USE_HEADERMAP' => 'YES',
    'DEFINES_MODULE' => 'YES',
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++20',
    'CLANG_CXX_LIBRARY' => 'libc++',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'OTHER_SWIFT_FLAGS' => "$(inherited) -DRCT_NEW_ARCH_ENABLED",
    # 'HEADER_SEARCH_PATHS' => header_search_paths.join(' '),
    # 'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) EXPO_MODULES_CORE_VERSION=' + package['version'],
  }

  if !$ExpoUseSources&.include?(package['name']) && ENV['EXPO_USE_SOURCE'].to_i == 0 && File.exist?("#{s.name}.xcframework") && Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.10.0')
    s.source_files = "**/*.h"
    s.vendored_frameworks = "#{s.name}.xcframework"
  else
    s.source_files = "**/*.{h,mm,swift,cpp}"
  end

  s.public_header_files = ['**/*.h']
end
