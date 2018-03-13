
# generated from template-files/ios/ExpoKit.podspec

Pod::Spec.new do |s|
  s.name = "ExpoKit"
  s.version = "${IOS_EXPONENT_CLIENT_VERSION}"
  s.summary = 'ExpoKit'
  s.description = 'ExpoKit allows native projects to integrate with the Expo SDK.'
  s.homepage = 'http://docs.expo.io'
  s.license = 'BSD'
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
  end

  s.subspec "CPP" do |ss|
    ss.dependency "ExpoKit/Core"
    ss.source_files = 'cpp/*.{h,c,cpp,m,mm}', 'cpp/**/*.{h,c,cpp,m,mm}'
    ss.exclude_files = 'cpp/UEXGL.*'
  end

  s.subspec "GL" do |ss|
    ss.dependency "ExpoKit/CPP"
    ss.source_files = 'cpp/UEXGL.*'
    ss.compiler_flags = '-x objective-c++'
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
    ss.dependency "ExpoKit/Core"
    ss.dependency "GoogleMobileVision/FaceDetector", '~> 1.1.0'
    ss.dependency "GoogleMobileVision/MVDataOutput", '~> 1.1.0'
    ss.source_files = 'ios/Exponent/Versioned/Optional/FaceDetector/**'
  end
end
