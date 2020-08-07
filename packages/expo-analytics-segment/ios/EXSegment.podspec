require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

segment_analytics_version = '~> 4.0'
using_custom_segment_analytics_version = defined? $AnalyticsVersion
if using_custom_segment_analytics_version
  segment_analytics_version = $AnalyticsVersion
  Pod::UI.puts "expo-analytics-segment: Using user specified Analytics version '#{$segment_analytics_version}'"
end

Pod::Spec.new do |s|
  s.name           = 'EXSegment'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '10.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.source_files   = 'EXSegment/**/*.{h,m}'
  s.preserve_paths = 'EXSegment/**/*.{h,m}'
  s.requires_arc   = true

  s.dependency 'UMCore'
  s.dependency 'UMConstantsInterface'
  s.dependency 'Analytics', segment_analytics_version
end
