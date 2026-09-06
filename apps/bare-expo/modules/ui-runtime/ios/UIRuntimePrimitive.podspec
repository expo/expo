require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name = 'UIRuntimePrimitive'
  s.version = package['version']
  s.summary = package['description']
  s.license = package['license']
  s.author = package['author']
  s.homepage = package['homepage']
  s.platforms = { :ios => '16.4' }
  s.source = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.source_files = '**/*.{h,mm}'
  s.dependency 'hermes-engine'
  install_modules_dependencies(s)
end
