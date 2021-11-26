require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name              = 'RNSVG'
  s.version           = package['version']
  s.summary           = package['description']
  s.license           = package['license']
  s.homepage          = package['homepage']
  s.authors           = 'Horcrux Chen'
  s.platforms         = { :osx => "10.14", :ios => "9.0", :tvos => "9.2" }
  s.source            = { :git => 'https://github.com/react-native-community/react-native-svg.git', :tag => "v#{s.version}" }
  s.source_files      = 'apple/**/*.{h,m}'
  s.ios.exclude_files = '**/*.macos.{h,m}'
  s.tvos.exclude_files = '**/*.macos.{h,m}'
  s.osx.exclude_files = '**/*.ios.{h,m}'
  s.requires_arc      = true
  s.dependency          'React-Core'
end
