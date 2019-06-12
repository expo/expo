require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'UMReactNativeAdapter'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '10.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.source_files   = 'UMReactNativeAdapter/**/*.{h,m,mm}'
  s.preserve_paths = 'UMReactNativeAdapter/**/*.{h,m,mm}'
  s.requires_arc   = true

  s.dependency 'React'
  s.dependency 'React-turbomodule-core'
  s.dependency 'React-jsi'
  s.dependency 'UMCore'
  s.dependency 'UMFontInterface'
end

  
