require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

macro_flags = '-Xfrontend -load-plugin-executable -Xfrontend /Users/kudo/ExpoModulesOptimized/.build/release/ExpoModulesOptimizedMacros-tool#ExpoModulesOptimizedMacros'

Pod::Spec.new do |s|
  s.name           = 'BenchmarkingModule'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '15.1',
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.source_files = '**/*.{h,cpp,m,mm,swift}'
  
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = {
    'OTHER_SWIFT_FLAGS' => "$(inherited) #{macro_flags}",
  }

  install_modules_dependencies(s)
end
