require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoAppIntents'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '16.4',
    :osx => '13.4',
    :tvos => '16.4'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'ExpoUI'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.exclude_files = 'Tests/'
  s.test_spec 'Tests' do |test_spec|
    test_spec.dependency 'ExpoModulesTestCore'
    test_spec.source_files = 'Tests/**/*.{m,swift}'
    # ExpoUI pulls in C++ through React, so the test target has to link the C++ runtime or the
    # link step fails on operator new and the __cxa_* personality symbols.
    test_spec.libraries = 'c++'
  end
end
