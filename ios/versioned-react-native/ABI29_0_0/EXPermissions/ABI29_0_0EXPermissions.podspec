require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ABI29_0_0EXPermissions'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '9.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.source_files   = 'ABI29_0_0EXPermissions/**/*.{h,m}'
  s.preserve_paths = 'ABI29_0_0EXPermissions/**/*.{h,m}'
  s.requires_arc   = true

  s.dependency 'ABI29_0_0EXCore'
  s.dependency 'ABI29_0_0EXPermissionsInterface'

end

  
