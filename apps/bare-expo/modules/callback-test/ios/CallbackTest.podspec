Pod::Spec.new do |s|
  s.name           = 'CallbackTest'
  s.version        = '0.0.1'
  s.summary        = 'Local module for testing the Callback argument type'
  s.description    = 'Local module for testing the Callback argument type'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
