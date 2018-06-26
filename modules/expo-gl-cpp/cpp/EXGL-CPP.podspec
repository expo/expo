require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'EXGL-CPP'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '9.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.source_files   = '**/*.{h,c,cpp,mm}'
  s.preserve_paths = '**/*.{h,c,cpp,mm}'
  s.exclude_files  = 'UEXGL.*'
  s.requires_arc   = true
  
  s.pod_target_xcconfig = {
    'CLANG_WARN_COMMA' => 'NO',
    'CLANG_WARN_UNGUARDED_AVAILABILITY' => 'NO'
  }
  
  s.subspec 'UEXGL' do |ss|
    ss.source_files = 'UEXGL.*'
    ss.compiler_flags = '-x objective-c++'
  end
end
