require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoBlob'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '16.4'
  }
  s.swift_version  = '6.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,swift}"
  s.exclude_files = ['Tests', 'Benchmarks']
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.test_spec 'Tests' do |test_spec|
    test_spec.dependency 'ExpoModulesTestCore'
    test_spec.source_files = 'Tests'
    test_spec.pod_target_xcconfig = {
      # The test bundle links the static ExpoModulesCore dependency chain, which contains C++.
      'OTHER_LDFLAGS' => '-lc++'
    }
  end

  # Performance benchmarks, run with `et native-unit-tests --benchmarks`. A separate spec, so unit
  # test runs neither build nor run them.
  s.test_spec 'Benchmarks' do |test_spec|
    test_spec.dependency 'ExpoModulesTestCore'
    test_spec.source_files = 'Benchmarks'
    test_spec.pod_target_xcconfig = {
      # The test bundle links the static ExpoModulesCore dependency chain, which contains C++.
      'OTHER_LDFLAGS' => '-lc++'
    }
  end
end
