
# generated from template-files/ios/ExpoKit.podspec

Pod::Spec.new do |s|
  s.name = "ExpoKit"
  s.version = "2.5.7"
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

    ss.dependency 'Amplitude-iOS', '~> 3.8'
    ss.dependency 'Analytics', '~> 3.5'
    ss.dependency 'AppAuth', '~> 0.4'
    ss.dependency 'CocoaLumberjack', '~> 3.2.1'
    ss.dependency 'Crashlytics', '~> 3.8'
    ss.dependency 'FBAudienceNetwork', '~> 4.24'
    ss.dependency 'FBSDKCoreKit', '~> 4.28'
    ss.dependency 'FBSDKLoginKit', '~> 4.28'
    ss.dependency 'FBSDKShareKit', '~> 4.28'
    ss.dependency 'Fabric', '~> 1.6'
    ss.dependency 'GoogleSignIn', '~> 3.0'
    ss.dependency 'GoogleMaps', '~> 2.5.0'
    ss.dependency 'Google-Maps-iOS-Utils', '~> 2.1.0'
    ss.dependency 'lottie-ios', '~> 2.1.3'
    ss.dependency 'GPUImage', '~> 0.1.7'
    ss.dependency 'JKBigInteger2', '0.0.5'
    ss.dependency 'Branch', '~> 0.14.12'
    ss.dependency 'Google-Mobile-Ads-SDK', '~> 7.22.0'
    ss.dependency 'React' # explicit dependency required for CocoaPods >= 1.5.0
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
