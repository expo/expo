require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'EXTaskManagerInterface'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '10.0'
  s.source         = { git: 'https://github.com/expo/expo-task-manager-interface.git' }
  s.source_files   = 'EXTaskManagerInterface/**/*.{h,m}'
  s.preserve_paths = 'EXTaskManagerInterface/**/*.{h,m}'
  s.requires_arc   = true

  s.dependency 'EXCore'
end
