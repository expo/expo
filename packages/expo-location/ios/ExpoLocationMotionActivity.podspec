require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoLocationMotionActivity'
  s.version        = package['version']
  s.summary        = 'CoreMotion-based motion activity provider for expo-location'
  s.description    = 'Provides motion activity updates and permissions through CoreMotion for expo-location'
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { :git => 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoLocation'
  s.frameworks = 'CoreMotion'

  s.source_files = 'motion-activity/**/*.{h,m,swift}'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }
end
