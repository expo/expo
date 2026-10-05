require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
podfile_properties = JSON.parse(File.read("#{Pod::Config.instance.installation_root}/Podfile.properties.json")) rescue {}

Pod::Spec.new do |s|
  s.name           = 'ExpoLocation'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }
  if podfile_properties['expo.location.motionActivityEnabled'] == 'false'
    pod_target_xcconfig['OTHER_SWIFT_FLAGS'] = '$(inherited) -DEXPO_LOCATION_DISABLE_MOTION'
  end
  s.pod_target_xcconfig = pod_target_xcconfig

  s.source_files = "**/*.{h,m,swift}"
end
