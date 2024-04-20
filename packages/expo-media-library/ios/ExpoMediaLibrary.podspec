require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoMediaLibrary'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '13.4'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.frameworks     = 'Photos','PhotosUI'

  s.dependency 'ExpoModulesCore'
  s.dependency 'React-Core'

  s.resource_bundles = {'ExpoMediaLibrary_privacy' => ['PrivacyInfo.xcprivacy']}

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.source_files = "**/*.{h,m,swift}"
end
