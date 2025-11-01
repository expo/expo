require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

use_hermes = ENV['USE_HERMES'] == nil || ENV['USE_HERMES'] == '1'

Pod::Spec.new do |s|
  s.name           = 'ExpoModulesJSI'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms       = {
    :ios => '15.1',
    :osx => '11.0',
    :tvos => '15.1'
  }
  s.swift_version  = '6.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.header_dir     = 'ExpoModulesJSI'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'USE_HEADERMAP' => 'YES',
    'DEFINES_MODULE' => 'YES',
  }

  if use_hermes
    s.dependency 'hermes-engine'
  else
    s.dependency 'React-jsc'
  end

  s.dependency 'React-Core'
  s.dependency 'ReactCommon'

  s.source_files = ['ios/JSI/**/*.{h,m,mm,swift,cpp}', 'common/cpp/JSI/**/*.{h,cpp}']
  s.exclude_files = ['ios/JSI/Tests']
  s.private_header_files = ['ios/JSI/**/*+Private.h', 'ios/JSI/**/Swift.h']

  s.test_spec 'Tests' do |test_spec|
    test_spec.dependency 'ExpoModulesTestCore'
    test_spec.source_files = 'ios/JSI/Tests/**/*.{m,swift}'
  end
end
