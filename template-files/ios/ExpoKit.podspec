
# generated from template-files/ios/ExpoKit.podspec

Pod::Spec.new do |s|
  s.name = "ExpoKit"
  s.version = "${IOS_EXPONENT_CLIENT_VERSION}"
  s.summary = 'ExpoKit'
  s.description = 'ExpoKit allows native projects to integrate with the Expo SDK.'
  s.homepage = 'http://docs.expo.io'
  s.license = 'MIT'
  s.author = "650 Industries, Inc."
  s.requires_arc = true
  s.platform = :ios, "11.0"
  s.default_subspec = "Core"
  s.source = { :git => "http://github.com/expo/expo.git" }
  s.xcconfig = {
    'CLANG_CXX_LANGUAGE_STANDARD' => 'gnu++14',
    'SYSTEM_HEADER_SEARCH_PATHS' => "\"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/Folly\" \"$(PODS_ROOT)/Headers/Private/React-Core\"",
    'OTHER_CPLUSPLUSFLAGS' => [
      "$(OTHER_CFLAGS)",
      "-DFOLLY_NO_CONFIG",
      "-DFOLLY_MOBILE=1",
      "-DFOLLY_USE_LIBCPP=1"
    ]
  }

  s.subspec "Core" do |ss|
    ss.source_files = "Exponent/**/*.{h,m,mm,cpp}", "../template-files/keys.json"
    ss.preserve_paths = "Exponent/**/*.{h,m,mm,cpp}"
    ss.exclude_files = "Exponent/Supporting/**", "Exponent/Versioned/Optional/**/*.{h,m}"

${IOS_EXPOKIT_DEPS}
    ss.dependency 'React-Core' # explicit dependency required for CocoaPods >= 1.5.0
    ss.dependency 'ReactCommon' # needed for react-native-reanimated, see https://github.com/expo/expo/pull/11096#how

    # Universal modules required by ExpoKit so the code compiles
    ss.dependency 'UMCore'
    ss.dependency 'UMReactNativeAdapter'
    ss.dependency 'UMSensorsInterface'
    ss.dependency 'UMFileSystemInterface'
    ss.dependency 'UMPermissionsInterface'
  end

  s.subspec "Payments" do |ss|
    ss.dependency "ExpoKit/Core"
    ss.dependency 'Stripe', '~> 10.1.0'
    ss.source_files = 'Exponent/Versioned/Optional/Payments/*.{h,m}'
  end

  s.subspec "FaceDetector" do |ss|
    ss.dependency "EXFaceDetector"
  end
end
