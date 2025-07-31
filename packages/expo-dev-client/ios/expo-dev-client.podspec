require 'json'

package = JSON.parse(File.read(File.join(__dir__, '../package.json')))

Pod::Spec.new do |s|
  s.name           = 'expo-dev-client'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.header_dir     = 'EXDevClient'

  s.dependency 'expo-dev-launcher', :configurations => :debug
  s.dependency 'expo-dev-menu', :configurations => :debug
  s.dependency 'expo-dev-menu-interface'
  s.dependency 'EXManifests', :configurations => :debug
  s.dependency 'EXUpdatesInterface'
end
