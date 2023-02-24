
# generated from template-files/ios/ExpoKit.podspec

Pod::Spec.new do |s|
  s.name = "ExpoKit"
  s.version = "48.0.0"
  s.summary = 'ExpoKit'
  s.description = 'ExpoKit allows native projects to integrate with the Expo SDK.'
  s.homepage = 'http://docs.expo.io'
  s.license = 'MIT'
  s.author = "650 Industries, Inc."
  s.requires_arc = true
  s.platform = :ios, "13.0"
  s.swift_version  = '5.4'
  s.default_subspec = "Core"
  s.source = { :git => "http://github.com/expo/expo.git" }
  s.xcconfig = {
    'CLANG_CXX_LANGUAGE_STANDARD' => 'gnu++14',
    'SYSTEM_HEADER_SEARCH_PATHS' => "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/Headers/Private/React-Core\"",
    'OTHER_CPLUSPLUSFLAGS' => [
      "$(OTHER_CFLAGS)",
      "-DFOLLY_NO_CONFIG",
      "-DFOLLY_MOBILE=1",
      "-DFOLLY_USE_LIBCPP=1"
    ]
  }

  s.pod_target_xcconfig = {
    'USE_HEADERMAP' => 'YES',
    'DEFINES_MODULE' => 'YES',
  }

  s.subspec "Core" do |ss|
    ss.source_files = "Exponent/**/*.{h,m,mm,cpp,swift}", "../template-files/keys.json"
    ss.preserve_paths = "Exponent/**/*.{h,m,mm,cpp,swift}"
    ss.exclude_files = "Exponent/Supporting/**", "Exponent/Versioned/Optional/**/*.{h,m,swift}"

    ss.dependency 'Amplitude', '~> 6.0.0'
    ss.dependency 'CocoaLumberjack', '~> 3.5.3'
    ss.dependency 'GoogleMaps', '~> 3.3'
    ss.dependency 'Google-Maps-iOS-Utils', '~> 2.1.0'
    ss.dependency 'lottie-ios', '~> 3.2.3'
    ss.dependency 'JKBigInteger', '0.0.6'
    ss.dependency 'MBProgressHUD', '~> 1.2.0'
    ss.dependency 'React-Core' # explicit dependency required for CocoaPods >= 1.5.0
    ss.dependency 'ReactCommon' # needed for react-native-reanimated, see https://github.com/expo/expo/pull/11096#how

    # Universal modules required by ExpoKit so the code compiles
    ss.dependency 'ExpoModulesCore'
  end

  s.subspec "FaceDetector" do |ss|
    ss.dependency "EXFaceDetector"
  end
end
