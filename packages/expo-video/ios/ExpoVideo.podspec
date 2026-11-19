require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoVideo'
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
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,swift}"
  s.exclude_files = 'Tests'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'Tests'
    # The test bundle links C++ code from ExpoModulesCore but does not inherit its
    # user_target_xcconfig (-lc++), so link the C++ runtime explicitly.
    test_spec.libraries = 'c++'
  end
end
