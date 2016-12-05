
Pod::Spec.new do |s|
  s.name = "ExponentView"
  s.version = "0.1"
  s.summary = 'YOOOOO'
  s.description = 'HAAAAAY'
  s.homepage = 'http://docs.getexponent.com'
  s.license = 'BSD'
  s.author = "650 Industries, Inc."
  s.requires_arc = true
  s.platform = :ios, "8.0"
  s.source = { :git => "http://github.com/exponentjs/exponent.git" }
  s.source_files = "ios/Exponent/**/*.{h,m}"
  s.preserve_paths = "ios/Exponent/**/*.{h,m}"
  s.exclude_files = "ios/Exponent/EXAppDelegate.*", "ios/Exponent/EXRootViewController.*", "ios/Exponent/Supporting/**"

  s.dependency 'AppAuth', '~> 0.4'
  s.dependency 'CocoaLumberjack', '~> 2.3'
  s.dependency 'Crashlytics', '~> 3.8'
  s.dependency 'Fabric', '~> 1.6'
  s.dependency 'Google/SignIn', '~> 3.0'
  s.dependency 'Amplitude-iOS', '~> 3.8'
  s.dependency 'FBSDKCoreKit', '~> 4.15'
  s.dependency 'FBSDKLoginKit', '~> 4.15'
  s.dependency 'FBSDKShareKit', '~> 4.15'
  s.dependency 'Analytics', '~> 3.5'
end
