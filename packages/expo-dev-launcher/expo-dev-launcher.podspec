require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name           = 'expo-dev-launcher'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '11.0'
  s.swift_version  = '5.2'
  s.source         = { :git => 'https://github.com/github_account/expo-development-client.git', :tag => '#{s.version}' }
  s.source_files   = 'ios/**/*.{h,m,swift,cpp}'
  s.preserve_paths = 'ios/**/*.{h,m,swift}'
  s.requires_arc   = true
  
  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = { "DEFINES_MODULE" => "YES" }
  
  s.dependency "React"
  s.dependency "EXDevMenuInterface"
end
