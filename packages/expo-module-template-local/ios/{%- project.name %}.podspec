require 'json'

Pod::Spec.new do |s|
  s.name           = '<%- project.name %>'
  s.version        = '0.0.1'
  s.summary        = 'A sample project summary'
  s.description    = 'A sample project description'
  s.license        = ''
  s.author         = ''
  s.homepage       = 'https://expo.dev/'
  s.platform       = :ios, '13.0'
  s.swift_version  = '5.4'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
  
  s.source_files = "**/*.{h,m,swift}"
end
