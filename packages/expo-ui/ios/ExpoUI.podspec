require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoUI'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  install_modules_dependencies(s)

  # Swift/Objective-C compatibility and worklets support
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'OTHER_CPLUSPLUSFLAGS' => '$(inherited) -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1 -DFOLLY_HAVE_CLOCK_GETTIME=1',
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++20',
    'HEADER_SEARCH_PATHS' => [
      '$(inherited)',
      '"$(PODS_ROOT)/Headers/Public/RNWorklets"',
      '"$(PODS_ROOT)/Headers/Private/Yoga"',
      '"$(PODS_ROOT)/RCT-Folly"',
      '"$(PODS_ROOT)/boost"',
      '"$(PODS_ROOT)/DoubleConversion"',
      '"$(PODS_ROOT)/Headers/Private/React-Core"',
    ].join(' '),
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
