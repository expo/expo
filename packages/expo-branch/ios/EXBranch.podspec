require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'EXBranch'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '10.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.source_files   = 'EXBranch/**/*.{h,m}'
  s.preserve_paths = 'EXBranch/**/*.{h,m}'
  s.requires_arc   = true
  s.compiler_flags = %[-DRNBRANCH_VERSION=@\\"#{package["dependencies"]["react-native-branch"]}\\"]

  s.dependency 'UMCore'
  s.dependency 'React-Core'
  s.dependency 'Branch', '0.35.0'
end
