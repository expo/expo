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
    :ios => '15.1'
  }
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.source_files   = 'ExpoMaps/**/*.{h,m,swift}'
  s.preserve_paths = 'ExpoMaps/**/*.{h,m,swift}'
  s.requires_arc   = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'GoogleMaps', '7.4.0'
#  s.dependency 'Google-Maps-iOS-Utils', '4.1.0'
  s.dependency 'GooglePlaces', '7.3.0'
end
