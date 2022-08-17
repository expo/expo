require 'json'

Pod::Spec.new do |s|
  s.name         = "dev-menu-react-native-safe-area-context"
  s.version      = "3.3.2"
  s.platform       = :ios, '12.0'
  s.source       = { :git => "https://github.com/th3rdwave/react-native-safe-area-context.git", :tag => "v3.3.2" }
  s.source_files  = "ios/**/*.{h,m}"

  s.dependency 'React-Core'
end
