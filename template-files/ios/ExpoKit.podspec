
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
  s.platform = :ios, "9.0"
  s.default_subspec = "Core"
  s.source = { :git => "http://github.com/expo/expo.git" }

  s.subspec "Core" do |ss|
    ss.source_files = "ios/Exponent/**/*.{h,m}", "template-files/keys.json"
    ss.preserve_paths = "ios/Exponent/**/*.{h,m}"
    ss.exclude_files = "ios/Exponent/Supporting/**", "ios/Exponent/Versioned/Optional/**/*.{h,m}"

${IOS_EXPOKIT_DEPS}
    ss.dependency 'React' # explicit dependency required for CocoaPods >= 1.5.0

    # Universal modules required by ExpoKit so the code compiles
    ss.dependency 'EXCore'
    ss.dependency 'EXReactNativeAdapter'
    ss.dependency 'EXSensorsInterface'
    ss.dependency 'EXFileSystemInterface'
    ss.dependency 'EXPermissionsInterface'
    ss.dependency 'EXCameraInterface'
    ss.dependency 'EXConstantsInterface'
  end

  s.subspec "Payments" do |ss|
    ss.dependency "ExpoKit/Core"
    ss.dependency 'Stripe', '~> 10.1.0'
    ss.source_files = 'ios/Exponent/Versioned/Optional/Payments/*.{h,m}'
  end

  s.subspec "AR" do |ss|
    ss.dependency "ExpoKit/Core"
    ss.source_files = 'ios/Exponent/Versioned/Optional/ARKit/**'
  end

  s.subspec "FaceDetector" do |ss|
    ss.dependency "EXFaceDetector"
  end
end
