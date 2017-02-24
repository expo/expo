
Pod::Spec.new do |s|
  s.name = "ExponentView"
  s.version = "${IOS_EXPONENT_CLIENT_VERSION}"
  s.summary = 'Exponent'
  s.description = 'Exponent lets web developers build truly native apps that work across both iOS and Android by writing them once in just JavaScript.'
  s.homepage = 'http://docs.getexponent.com'
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
