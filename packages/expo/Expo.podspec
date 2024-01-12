require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'Expo'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms       = {
    :ios => '13.4',
    :osx => '10.15',
    :tvos => '13.4'
  }
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.header_dir     = 'Expo'

  s.dependency 'ExpoModulesCore'

  s.source_files = 'ios/**/*.{h,m,swift}'
end
