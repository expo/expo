require 'json'

# reanimated 2

reactVersion = '0.0.0'

begin
  reactVersion = `node --print "require('react-native/package.json').version"`
rescue
  reactVersion = '0.66.0'
end

rnVersion = reactVersion.split('.')[1]

folly_prefix = ""
if rnVersion.to_i >= 64
  folly_prefix = "RCT-"
end

folly_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DRNVERSION=' + rnVersion
folly_compiler_flags = folly_flags + ' ' + '-Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.04.26.00'
boost_compiler_flags = '-Wno-documentation'


require_relative 'TargetValidator'
# end reanimated 2

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'expo-dev-menu'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '12.0'
  s.swift_version  = '5.2'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.requires_arc   = true
  s.header_dir     = 'EXDevMenu'

  s.resource_bundles = { 'EXDevMenu' => [
    'ios/assets',
    'assets/*.ios.js',
    'assets/dev-menu-packager-host',
    'assets/*.ttf',
    'assets/*.otf'
  ]}

  s.xcconfig = { 'GCC_PREPROCESSOR_DEFINITIONS' => 'EX_DEV_MENU_ENABLED=1', 'OTHER_SWIFT_FLAGS' => '-DEX_DEV_MENU_ENABLED' }

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = { "DEFINES_MODULE" => "YES" }

  s.subspec 'GestureHandler' do |handler|
    handler.source_files = 'vendored/react-native-gesture-handler/**/*.{h,m}'
    handler.private_header_files = 'vendored/react-native-gesture-handler/**/*.h'

    handler.compiler_flags = '-w -Xanalyzer -analyzer-disable-all-checks'
  end

  s.subspec 'Reanimated' do |reanimated|
    reanimated.compiler_flags = folly_compiler_flags + ' ' + boost_compiler_flags + ' -w -Xanalyzer -analyzer-disable-all-checks -x objective-c++'
    reanimated.private_header_files = 'vendored/react-native-reanimated/**/*.h'
    reanimated.source_files = 'vendored/react-native-reanimated/**/*.{h,m,mm,cpp}'
    reanimated.preserve_paths = 'vendored/react-native-reanimated/Common/cpp/hidden_headers/**'
    reanimated.pod_target_xcconfig = {
      "USE_HEADERMAP" => "YES",
      "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_TARGET_SRCROOT)\" \"$(PODS_ROOT)/#{folly_prefix}Folly\" \"$(PODS_ROOT)/boost\"  \"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/Headers/Private/React-Core\" "
    }
    reanimated.xcconfig = {
      'CLANG_CXX_LIBRARY' => 'libc++',
      "CLANG_CXX_LANGUAGE_STANDARD" => "c++14",
      "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/glog\" \"$(PODS_ROOT)/#{folly_prefix}Folly\" \"${PODS_ROOT}/Headers/Public/React-hermes\" \"${PODS_ROOT}/Headers/Public/hermes-engine\"",
                                 "OTHER_CFLAGS" => "$(inherited)" + " " + folly_flags
    }

    reanimated.dependency 'FBLazyVector'
    reanimated.dependency 'FBReactNativeSpec'
    reanimated.dependency 'RCTRequired'
    reanimated.dependency 'RCTTypeSafety'
    reanimated.dependency 'React-Core'
    reanimated.dependency 'React-CoreModules'
    reanimated.dependency 'React-Core/DevSupport'
    reanimated.dependency 'React-RCTActionSheet'
    reanimated.dependency 'React-RCTNetwork'
    reanimated.dependency 'React-RCTAnimation'
    reanimated.dependency 'React-RCTLinking'
    reanimated.dependency 'React-RCTBlob'
    reanimated.dependency 'React-RCTSettings'
    reanimated.dependency 'React-RCTText'
    reanimated.dependency 'React-RCTVibration'
    reanimated.dependency 'React-RCTImage'
    reanimated.dependency 'React-Core/RCTWebSocket'
    reanimated.dependency 'React-cxxreact'
    reanimated.dependency 'React-jsi'
    reanimated.dependency 'React-jsiexecutor'
    reanimated.dependency 'React-jsinspector'
    reanimated.dependency 'ReactCommon/turbomodule/core'
    reanimated.dependency 'Yoga'
    reanimated.dependency 'DoubleConversion'
    reanimated.dependency 'glog'

    if reactVersion.match(/^0.62/)
      reanimated.dependency 'ReactCommon/callinvoker'
    else
      reanimated.dependency 'React-callinvoker'
    end

    reanimated.dependency "#{folly_prefix}Folly"
  end


  s.subspec 'SafeAreaView' do |safearea|
    safearea.source_files = 'vendored/react-native-safe-area-context/**/*.{h,m}'
    safearea.private_header_files = 'vendored/react-native-safe-area-context/**/*.h'

    safearea.compiler_flags = '-w -Xanalyzer -analyzer-disable-all-checks'
  end

  s.subspec 'Vendored' do |vendored|
    vendored.dependency "expo-dev-menu/GestureHandler"
    vendored.dependency "expo-dev-menu/Reanimated"
    vendored.dependency "expo-dev-menu/SafeAreaView"
  end

  s.subspec 'Main' do |main|
    s.source_files   = 'ios/**/*.{h,m,mm,swift}'
    s.preserve_paths = 'ios/**/*.{h,m,mm,swift}'
    s.exclude_files  = 'ios/*Tests/**/*', 'vendored/**/*'

    main.dependency 'React-Core'
    main.dependency "EXManifests"
    main.dependency 'ExpoModulesCore'
    main.dependency 'expo-dev-menu-interface'
    main.dependency "expo-dev-menu/Vendored"
  end

  s.test_spec 'Tests' do |test_spec|
    test_spec.requires_app_host = false
    test_spec.source_files = 'ios/Tests/**/*'
    test_spec.dependency 'Quick'
    test_spec.dependency 'Nimble'
    test_spec.dependency 'React-CoreModules'
    test_spec.platform = :ios, '12.0'
  end

  s.test_spec 'UITests' do |test_spec|
    test_spec.requires_app_host = true
    test_spec.source_files = 'ios/UITests/**/*'
    test_spec.dependency 'React-CoreModules'
    test_spec.dependency 'React'
    test_spec.platform = :ios, '12.0'
  end

  s.default_subspec = 'Main'
end
