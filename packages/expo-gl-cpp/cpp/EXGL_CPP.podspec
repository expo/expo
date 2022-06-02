require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'EXGL_CPP'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '12.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.frameworks = 'OpenGLES'

  s.compiler_flags = '-x objective-c++ -std=c++1z -fno-aligned-allocation'
  # aligned-allocation can be enabled when support for iOS 10 is dropped

  s.pod_target_xcconfig = {
    'CLANG_WARN_COMMA' => 'NO',
    'CLANG_WARN_UNGUARDED_AVAILABILITY' => 'NO',
    'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) GLES_SILENCE_DEPRECATION=1'
  }

  s.dependency 'React-jsi'

  if !$ExpoUseSources&.include?(package['name']) && ENV['EXPO_USE_SOURCE'].to_i == 0 && File.exist?("#{s.name}.xcframework") && Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.10.0')
    s.source_files = '**/*.h'
    s.vendored_frameworks = "#{s.name}.xcframework"
  else
    s.source_files = '**/*.{h,m,c,cpp,mm}'
    s.exclude_files  = '**/EXGLJniApi.cpp'
  end
end
