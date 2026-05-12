require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
podfile_properties = JSON.parse(File.read("#{Pod::Config.instance.installation_root}/Podfile.properties.json")) rescue {}
property_override = podfile_properties['expo-image.disable-libdav1d']
env_override = ENV['EXPO_IMAGE_DISABLE_LIBDAV1D']
disable_libdav1d =
  if property_override.nil?
    env_override == '1' || env_override == 'true'
  else
    property_override == 'true'
  end

Pod::Spec.new do |s|
  s.name           = 'ExpoImage'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.swift_version  = '6.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'SDWebImage', '~> 5.21.0'
  s.dependency 'SDWebImageAVIFCoder', '~> 0.11.0'
  s.dependency 'SDWebImageSVGCoder', '~> 1.7.0'
  s.dependency 'SDWebImageWebPCoder', '~> 0.14.6'
  s.dependency 'libavif/libdav1d' unless disable_libdav1d

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,swift}"
  s.exclude_files = 'Tests/'

  s.test_spec 'Tests' do |test_spec|
    test_spec.dependency 'ExpoModulesTestCore'

    test_spec.source_files = 'Tests/**/*.{m,swift}'
  end
end
