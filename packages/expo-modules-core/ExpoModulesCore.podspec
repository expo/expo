require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))
fabric_enabled = ENV['RCT_NEW_ARCH_ENABLED'] == '1'
fabric_compiler_flags = '-DRN_FABRIC_ENABLED'
folly_version = '2021.07.22.00'
folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'

Pod::Spec.new do |s|
  s.name           = 'ExpoModulesCore'
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
  s.header_dir     = 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'USE_HEADERMAP' => 'YES',
    'DEFINES_MODULE' => 'YES',
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'HEADER_SEARCH_PATHS' => "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/Headers/Private/React-bridging/react/bridging\" \"$(PODS_CONFIGURATION_BUILD_DIR)/React-bridging/react_bridging.framework/Headers\"",
    'OTHER_SWIFT_FLAGS' => "$(inherited) #{fabric_enabled ? fabric_compiler_flags : ''}"
  }
  s.user_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "\"${PODS_CONFIGURATION_BUILD_DIR}/ExpoModulesCore/Swift Compatibility Header\" \"$(PODS_ROOT)/Headers/Private/React-bridging/react/bridging\" \"$(PODS_CONFIGURATION_BUILD_DIR)/React-bridging/react_bridging.framework/Headers\"",
  }

  s.dependency 'React-Core'
  s.dependency 'ReactCommon/turbomodule/core'

  if fabric_enabled
    s.compiler_flags = folly_compiler_flags + ' ' + fabric_compiler_flags

    s.dependency 'React-RCTFabric'
    s.dependency 'RCT-Folly', folly_version
  end

  if !$ExpoUseSources&.include?(package['name']) && ENV['EXPO_USE_SOURCE'].to_i == 0 && File.exist?("ios/#{s.name}.xcframework") && Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.10.0')
    s.source_files = 'ios/**/*.h', 'common/cpp/**/*.h'
    s.vendored_frameworks = "ios/#{s.name}.xcframework"
  else
    s.source_files = 'ios/**/*.{h,m,mm,swift,cpp}', 'common/cpp/**/*.{h,cpp}'
  end

  exclude_files = ['ios/Tests/']
  if !fabric_enabled
    exclude_files.append('ios/Fabric/')
    exclude_files.append('common/cpp/fabric/')
  end
  s.exclude_files = exclude_files

  s.private_header_files = ['ios/**/*+Private.h', 'ios/**/Swift.h']

  s.test_spec 'Tests' do |test_spec|
    test_spec.dependency 'ExpoModulesTestCore'

    test_spec.source_files = 'ios/Tests/**/*.{m,swift}'
  end
end
