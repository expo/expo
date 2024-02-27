require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'EXUpdatesInterface'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '13.4', :tvos => '13.4' }
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.source_files = 'EXUpdatesInterface/**/*.{h,m,swift}'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'GCC_TREAT_INCOMPATIBLE_POINTER_TYPE_WARNINGS_AS_ERRORS' => 'YES',
    'GCC_TREAT_IMPLICIT_FUNCTION_DECLARATIONS_AS_ERRORS' => 'YES',
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
  s.user_target_xcconfig = {
    'HEADER_SEARCH_PATHS' => '"${PODS_CONFIGURATION_BUILD_DIR}/EXUpdatesInterface/Swift Compatibility Header"',
  }

  s.dependency 'ExpoModulesCore'
end
