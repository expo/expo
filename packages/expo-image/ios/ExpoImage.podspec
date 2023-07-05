require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoImage'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '13.0'
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'SDWebImage', '~> 5.15.8'
  s.dependency 'SDWebImageWebPCoder', '~> 0.11.0'
  s.dependency 'SDWebImageAVIFCoder', '~> 0.10.0'
  s.dependency 'SDWebImageSVGCoder', '~> 1.7.0'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '**/*.{h,m,mm,swift}'
  s.exclude_files = ['svgnative']
  s.default_subspec = "SVGNative"

  s.subspec "SVGNative" do |ss|
    ss.source_files = [
      'svgnative/include/**/*.{h,hpp}',
      'svgnative/src/**/*.{h,c,cc,cpp,hpp}',
    ]
    ss.public_header_files = 'svgnative/include/**/*.{h,hpp}'
    ss.header_mappings_dir = 'svgnative/include'
    ss.exclude_files = [
      'svgnative/src/xml/ExpatXMLParser.cpp',
      'svgnative/src/xml/RapidXMLParser.cpp',
    ]

    ss.pod_target_xcconfig = {
      'HEADER_SEARCH_PATHS' => '$(inherited) "$(PODS_ROOT)/boost"',
      'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17',
    }

    ss.compiler_flags = '-x objective-c++'

    ss.user_target_xcconfig = {
      'HEADER_SEARCH_PATHS' => '"$(PODS_ROOT)/boost"'
    }
    # ss.user_target_xcconfig = {
    #   'HEADER_SEARCH_PATHS' => '$(inherited) ${PODS_ROOT}/boost' # Hack because public header include <boost/variant.hpp>
    # }
    ss.preserve_paths = ['svgnative']

    ss.libraries = 'c++', 'xml2'
    ss.dependency 'boost'
  end
end
