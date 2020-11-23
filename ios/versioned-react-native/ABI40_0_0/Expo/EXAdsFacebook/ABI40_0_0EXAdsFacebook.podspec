require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

fb_audience_network_version = '~> 5.9.0'
using_custom_fb_audience_network_version = defined? $FBAudienceNetworkVersion
if using_custom_fb_audience_network_version
  fb_audience_network_version = $FBAudienceNetworkVersion
  Pod::UI.puts "expo-ads-facebook: Using user specified FBAudienceNetwork version '#{$fb_audience_network_version}'"
end

Pod::Spec.new do |s|
  s.name           = 'ABI40_0_0EXAdsFacebook'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '10.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.source_files   = 'ABI40_0_0EXAdsFacebook/**/*.{h,m}'
  s.preserve_paths = 'ABI40_0_0EXAdsFacebook/**/*.{h,m}'
  s.requires_arc   = true

  s.dependency 'ABI40_0_0UMCore'
  s.dependency 'FBAudienceNetwork', fb_audience_network_version
end
