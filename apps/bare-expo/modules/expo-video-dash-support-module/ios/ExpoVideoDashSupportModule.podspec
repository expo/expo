Pod::Spec.new do |s|
  s.name           = 'ExpoVideoDashSupportModule'
  s.version        = '1.0.0'
  s.summary        = 'Registers an external expo-video DASH transport provider.'
  s.description    = 'A bare-expo local module that registers a SegmentBase DASH-to-HLS transport provider. This provider is only meant for demonstration purposes and only works with selected DASH sources.'
  s.author         = ''
  s.homepage       = 'https://github.com/expo/expo'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'ExpoVideo'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
