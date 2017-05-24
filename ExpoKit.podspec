
# generated from template-files/ios/ExpoKit.podspec

Pod::Spec.new do |s|
  s.name = "ExpoKit"
  s.version = "1.16.2"
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
    ss.source_files = "ios/Exponent/**/*.{h,m}"
    ss.preserve_paths = "ios/Exponent/**/*.{h,m}"
    ss.exclude_files = "ios/Exponent/EXAppDelegate.*", "ios/Exponent/EXRootViewController.*", "ios/Exponent/Supporting/**"

    ss.dependency 'Amplitude-iOS', '~> 3.8'
    ss.dependency 'Analytics', '~> 3.5'
    ss.dependency 'AppAuth', '~> 0.4'
    ss.dependency 'CocoaLumberjack', '~> 3.0'
    ss.dependency 'Crashlytics', '~> 3.8'
    ss.dependency 'FBAudienceNetwork', '~> 4.22'
    ss.dependency 'FBSDKCoreKit', '~> 4.15'
    ss.dependency 'FBSDKLoginKit', '~> 4.15'
    ss.dependency 'FBSDKShareKit', '~> 4.15'
    ss.dependency 'Fabric', '~> 1.6'
    ss.dependency 'Google/SignIn', '~> 3.0'
    ss.dependency 'GoogleMaps', '~> 2.2.0'
    ss.dependency 'lottie-ios', '~> 1.5.1'
    ss.dependency 'GPUImage', '~> 0.1.7'
    ss.dependency 'Branch', '~> 0.14.12'
  end

  s.subspec "CPP" do |ss|
    ss.dependency "ExpoKit/Core"
    ss.source_files = 'cpp/*.{h,c,cpp,m,mm}', 'cpp/**/*.{h,c,cpp,m,mm}'
  end
end
