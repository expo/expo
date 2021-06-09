require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'EXFacebook'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '11.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }

  s.dependency 'UMCore'
  s.dependency 'ExpoModulesCore'
  s.dependency 'FacebookSDK/CoreKit', $FacebookSDKVersion || '9.2.0'
  s.dependency 'FacebookSDK/LoginKit', $FacebookSDKVersion || '9.2.0'

  # FacebookSDK is written in Swift, so must use this flag to import from it.
  s.pod_target_xcconfig = { 'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES' => 'YES' }

  if !$ExpoUseSources&.include?(package['name']) && ENV['EXPO_USE_SOURCE'].to_i == 0 && File.exist?("#{s.name}.xcframework") && Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.10.0')
    s.source_files = "#{s.name}/**/*.h"
    s.vendored_frameworks = "#{s.name}.xcframework"
  else
    s.source_files = "#{s.name}/**/*.{h,m}"
  end
end
