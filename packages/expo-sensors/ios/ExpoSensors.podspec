require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
podfile_properties = JSON.parse(File.read("#{Pod::Config.instance.installation_root}/Podfile.properties.json")) rescue {}

Pod::Spec.new do |s|
  s.name           = 'ExpoSensors'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '16.4'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.swift"
  s.exclude_files = "Tests/**"
  if podfile_properties['MOTION_PERMISSION'] == 'false'
    s.pod_target_xcconfig = {
      'OTHER_SWIFT_FLAGS' => '$(inherited) -DEXPO_DISABLE_MOTION_PERMISSION',
    }
  end

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'Tests/**/*.swift'
    test_spec.requires_app_host = false

    test_spec.pod_target_xcconfig = {
      'OTHER_LDFLAGS' => '$(inherited) -lc++'
    }
  end
end
