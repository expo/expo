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
    :ios => '15.1'
  }
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.header_dir     = 'ExpoModulesTestCore'

  s.source_files   = '**/*.{h,m,mm,swift}'

  s.dependency 'ExpoModulesCore'
  s.dependency 'Quick', '~> 7.3.0'
  s.dependency 'Nimble', '~> 13.0.0'

  # react_native_pods.rb will add the ENV['USE_HERMES'],
  # we could use this to check current js runtime.
  if ENV['USE_HERMES'] == '0'
    s.dependency 'React-jsc'
  else
    s.dependency 'React-hermes'
  end
end
