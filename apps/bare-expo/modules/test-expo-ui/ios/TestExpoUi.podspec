Pod::Spec.new do |s|
  s.name           = 'TestExpoUi'
  s.version        = '1.0.0'
  s.summary        = 'Test module demonstrating expo-ui extension pattern'
  s.description    = 'A sample module that extends expo-ui with custom components and modifiers'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'ExpoUI'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
