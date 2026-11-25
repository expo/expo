require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = package['name']
  s.version      = package['version']
  s.summary      = package['description']
  s.license      = package['license']

  s.authors      = package['author']
  s.homepage     = package['homepage']
  s.platform     = :ios, "15.1"

  s.source       = { :git => "https://github.com/gre/react-native-view-shot.git", :tag => "v#{s.version}" }
  s.source_files  = "ios/**/*.{h,m,mm}"
  s.resource_bundles = { 'RNViewShotPrivacyInfo' => ['ios/PrivacyInfo.xcprivacy'] }

  install_modules_dependencies(s) if defined?(install_modules_dependencies)
end

