require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ABI42_0_0EXUpdatesInterface'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '11.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.source_files   = 'ABI42_0_0EXUpdatesInterface/**/*.{h,m}'
  s.preserve_paths = 'ABI42_0_0EXUpdatesInterface/**/*.{h,m}'
  s.requires_arc   = true
end
