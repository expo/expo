
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
  s.source = { :git => "http://github.com/exponent/exponent.git" }
  s.source_files = "ios/Exponent/**/*.{h,m}"
  s.preserve_paths = "ios/Exponent/**/*.{h,m}"
  s.exclude_files = "ios/Exponent/EXAppDelegate.*", "ios/Exponent/EXRootViewController.*", "ios/Exponent/Supporting/**"

${IOS_EXPONENT_VIEW_DEPS}
end
