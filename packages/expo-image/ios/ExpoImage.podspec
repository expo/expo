require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
podfile_properties = JSON.parse(File.read("#{Pod::Config.instance.installation_root}/Podfile.properties.json")) rescue {}

truthy_property = lambda do |property_name, env_name|
  property_override = podfile_properties[property_name]
  if property_override.nil?
    env_override = ENV[env_name]
    env_override == '1' || env_override == 'true'
  else
    property_override == 'true'
  end
end

enable_avif_coder = truthy_property.call('expo-image.enable-avif-coder', 'EXPO_IMAGE_ENABLE_AVIF_CODER')
enable_webp_coder = truthy_property.call('expo-image.enable-webp-coder', 'EXPO_IMAGE_ENABLE_WEBP_CODER')
disable_libdav1d = truthy_property.call('expo-image.disable-libdav1d', 'EXPO_IMAGE_DISABLE_LIBDAV1D')
swift_flags = ['$(inherited)']
swift_flags << '-DEXPO_IMAGE_ENABLE_AVIF_CODER' if enable_avif_coder
swift_flags << '-DEXPO_IMAGE_ENABLE_WEBP_CODER' if enable_webp_coder

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
  s.dependency 'SDWebImageSVGCoder', '~> 1.7.0'
  s.dependency 'SDWebImageAVIFCoder', '~> 0.11.0' if enable_avif_coder
  s.dependency 'SDWebImageWebPCoder', '~> 0.14.6' if enable_webp_coder
  s.dependency 'libavif/libdav1d' if enable_avif_coder && !disable_libdav1d

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'OTHER_SWIFT_FLAGS' => swift_flags.join(' '),
  }

  s.source_files = "**/*.{h,m,swift}"
  s.exclude_files = 'Tests/'

  s.test_spec 'Tests' do |test_spec|
    test_spec.dependency 'ExpoModulesTestCore'

    test_spec.source_files = 'Tests/**/*.{m,swift}'
  end
end
