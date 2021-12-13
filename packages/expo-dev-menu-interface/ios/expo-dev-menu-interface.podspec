require 'json'

package = JSON.parse(File.read(File.join(__dir__, '../package.json')))

Pod::Spec.new do |s|
  s.name           = 'expo-dev-menu-interface'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '11.0'
  s.swift_version  = '5.2'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.source_files   = '**/*.{h,m,swift}'
  s.preserve_paths = '**/*.{h,m,swift}'
  s.exclude_files  = 'Tests/**/*.{h,m,swift}'
  s.requires_arc   = true
  s.header_dir     = 'EXDevMenuInterface'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = { "DEFINES_MODULE" => "YES" }

  s.test_spec 'Tests' do |test_spec|
    test_spec.platform     = :ios, '12.0'
    test_spec.source_files = 'Tests/**/*.{h,m,swift}'
    test_spec.dependency 'Quick'
    test_spec.dependency 'Nimble'
  end
end
