require 'json'
Pod::Spec.new do |s|
  s.name           = 'NativeComponentsModule'
  s.version        = '0.0.1'
  s.summary        = 'A module expo'
  s.description    = 'A module expo'
  s.license        = 'A module expo'
  s.author         = 'A module expo'
  s.homepage       = 'A module expo'
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
