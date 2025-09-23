require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'Expo'
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
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.header_dir     = 'Expo'

  s.pod_target_xcconfig = {
    'OTHER_SWIFT_FLAGS' => '$(inherited)' + (ENV["EXPO_DEBUG_LOG_BOX"] == "1" ? " -DEXPO_DEBUG_LOG_BOX" : ""),
  }

  # s.source_files = 'ios/**/*.{h,m,mm,swift}'
  # s.compiler_flags = compiler_flags
  # s.private_header_files = ['ios/**/Swift.h']
  s.resource_bundles = {
    'ExpoLogBox' => ['dist/ExpoLogBox.bundle/_expo', 'dist/ExpoLogBox.bundle/index.html'],
  }
end
