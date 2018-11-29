require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'EXFirebaseAuth'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '10.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.source_files   = 'EXFirebaseAuth/**/*.{h,m}'
  s.preserve_paths = 'EXFirebaseAuth/**/*.{h,m}'
  s.requires_arc   = true

  s.dependency 'EXCore'
  s.dependency 'EXFirebaseApp'
  s.dependency 'Firebase/Auth'
end

  
