Pod::Spec.new do |s|
  s.name         = 'ExponentCPP'
  s.version      = '1.0.0'
  s.license      = 'BSD-Exponent'
  s.homepage     = 'https://github.com/exponent/exponent/tree/master/cpp'
  s.authors      = { 'Nikhilesh Sigatapu' => 'nikki@getexponent.com' }
  s.summary      = 'Cross-platform C/C++ library for Exponent client code'

  s.platform     = :ios, "8.0"
  s.source       = { :path => '.' }

  s.source_files = '*.{h,c,cpp,m,mm}', '**/*.{h,c,cpp,m,mm}'
  s.exclude_files = 'UEXGL.*'

  s.subspec 'GL' do |ss|
    ss.source_files = 'UEXGL.*'
    ss.compiler_flags = '-x objective-c++'
  end
end
