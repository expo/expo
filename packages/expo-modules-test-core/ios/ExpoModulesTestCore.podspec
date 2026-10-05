require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoModulesTestCore'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '16.4'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.header_dir     = 'ExpoModulesTestCore'

  # Test specs depend on this pod to pull in the JS runtime that ExpoModulesCore requires when running
  # tests, to share the benchmark runner (see `Benchmarks`), and to give tests a runtime with a
  # JavaScript thread (see `Runtime`).
  s.source_files   = '{Benchmarks,Runtime}/**/*.swift'
  s.dependency 'ExpoModulesCore'

  # react_native_pods.rb will add the ENV['USE_HERMES'],
  # we could use this to check current js runtime.
  if ENV['USE_HERMES'] == '0'
    s.dependency 'React-jsc'
  else
    s.dependency 'React-hermes'
  end
end
