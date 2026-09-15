require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoMaps'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.source_files   = '**/*.{h,m,swift}'
  s.exclude_files  = 'Tests'
  s.preserve_paths = '**/*.{h,m,swift}'
  s.requires_arc   = true

  s.dependency 'ExpoModulesCore'

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'Tests'

    test_spec.pod_target_xcconfig = {
      'OTHER_LDFLAGS' => '$(inherited) -lc++'
    }
  end
end
