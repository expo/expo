require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoObserve'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.swift_version  = '6.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'ExpoAppMetrics'
  s.dependency 'EASClient'

  install_modules_dependencies(s)

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'GCC_PREPROCESSOR_DEFINITIONS' => [
      "EXPO_OBSERVE_VERSION=\"#{package['version']}\""
    ].compact
  }

  s.source_files = '*.{h,m,mm,swift}'

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'Tests'
    test_spec.pod_target_xcconfig = {
      'OTHER_LDFLAGS' => '-lc++'
    }
  end
end
