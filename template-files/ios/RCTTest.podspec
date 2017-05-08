require 'json'

package = JSON.parse(File.read(File.join('${REACT_NATIVE_PATH}', 'package.json')))

Pod::Spec.new do |s|
  s.name = "RCTTest"
  s.version = package["version"]
  s.summary = package["description"]
  s.description = "RCTTest hack spec"
  s.homepage = "http://facebook.github.io/react-native/"
  s.license = package["license"]
  s.author = "Facebook"
  s.requires_arc = true
  s.platform = :ios, "8.0"
  s.header_dir = "React"
  s.source = { :git => "https://github.com/expo/react-native.git" }
  s.source_files = "Libraries/RCTTest/**/*.{h,m}"
  s.frameworks = "XCTest"
end
