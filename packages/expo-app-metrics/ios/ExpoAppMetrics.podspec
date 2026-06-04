require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

reactNativeVersion = begin `node --print "require('react-native/package.json').version"`.strip rescue '0.0.0' end
expoSdkVersion = begin `node --print "require('expo/package.json').version"`.strip rescue '0.0.0' end
easBuildId = ENV.has_key?('EAS_BUILD_ID') ? ENV['EAS_BUILD_ID'] : nil

Pod::Spec.new do |s|
  s.name           = 'ExpoAppMetrics'
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
  s.dependency 'React-Core'
  s.dependency 'EXUpdatesInterface'

  s.libraries = 'sqlite3'

  install_modules_dependencies(s)

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'GCC_PREPROCESSOR_DEFINITIONS' => [
      "REACT_NATIVE_VERSION=\"#{reactNativeVersion}\"",
      "EXPO_SDK_VERSION=\"#{expoSdkVersion}\"",
      "EXPO_APP_METRICS_VERSION=\"#{package['version']}\"",
      easBuildId ? "EXPO_EAS_BUILD_ID=\"#{easBuildId}\"" : nil
    ].compact
  }

  s.source_files = '**/*.{h,m,mm,swift}'
  s.exclude_files = 'Tests'

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'Tests'
    test_spec.pod_target_xcconfig = {
      'OTHER_LDFLAGS' => '-lc++'
    }
  end
end
