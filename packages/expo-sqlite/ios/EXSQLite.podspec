require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'EXSQLite'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '10.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.source_files   = 'EXSQLite/**/*.{h,m}'
  s.preserve_paths = 'EXSQLite/**/*.{h,m}'
  s.requires_arc   = true

  s.dependency 'UMCore'
  s.dependency 'UMFileSystemInterface'

  s.dependency 'SQLCipher', '>= 3.4.0'
  s.xcconfig = {
    'OTHER_SWIFT_FLAGS' => '$(inherited) -D SQLITE_HAS_CODEC -D SQLITE_ENABLE_FTS5',
    'OTHER_CFLAGS' => '$(inherited) -DSQLITE_HAS_CODEC -DSQLITE_ENABLE_FTS5',
    'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) SQLITE_HAS_CODEC=1 SQLITE_ENABLE_FTS5=1'
  }
end
