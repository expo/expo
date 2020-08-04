require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'EXTaskManager'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '10.0'
  s.source         = { git: 'https://github.com/expo/expo-task-manager.git' }
  s.source_files   = 'EXTaskManager/**/*.{h,m}'
  s.preserve_paths = 'EXTaskManager/**/*.{h,m}'
  s.requires_arc   = true

  s.dependency 'UMCore'
  s.dependency 'UMConstantsInterface'
  s.dependency 'UMTaskManagerInterface'
  s.dependency 'UMAppLoader'
end
