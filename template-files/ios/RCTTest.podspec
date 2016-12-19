require 'json'

package = JSON.parse(File.read(File.join('${REACT_NATIVE_PATH}', 'package.json')))

Pod::Spec.new do |s|
  s.name = "RCTTest"
  s.version = package['version']
  s.summary = package['description']
  s.description = 'RCTTest hack spec'
  s.homepage = 'http://facebook.github.io/react-native/'
  s.license = package['license']
  s.author = "Facebook"
  s.requires_arc = true
  s.platform = :ios, "7.0"
  s.source = { :git => "https://github.com/exponent/react-native.git" }
  s.source_files = "Libraries/RCTTest/**/*.{h,m}"
  s.preserve_paths = "Libraries/RCTTest/**/*.js"
  s.frameworks = "XCTest"
end
