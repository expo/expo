require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

segment_analytics_version = '~> 4.0'
using_custom_segment_analytics_version = defined? $AnalyticsVersion
if using_custom_segment_analytics_version
  segment_analytics_version = $AnalyticsVersion
  Pod::UI.puts "expo-analytics-segment: Using user specified Analytics version '#{$segment_analytics_version}'"
end

Pod::Spec.new do |s|
  s.name           = 'ABI40_0_0EXSegment'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '10.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.source_files   = 'ABI40_0_0EXSegment/**/*.{h,m}'
  s.preserve_paths = 'ABI40_0_0EXSegment/**/*.{h,m}'
  s.requires_arc   = true

  s.dependency 'ABI40_0_0UMCore'
  s.dependency 'ABI40_0_0UMConstantsInterface'
  s.dependency 'Analytics', segment_analytics_version
end
