require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'EXUpdatesInterface'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '13.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.source_files   = 'EXUpdatesInterface/**/*.{h,m}'
  s.preserve_paths = 'EXUpdatesInterface/**/*.{h,m}'
  s.requires_arc   = true

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }
end
