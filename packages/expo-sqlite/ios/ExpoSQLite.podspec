require 'fileutils'
require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
podfile_properties = JSON.parse(File.read("#{Pod::Config.instance.installation_root}/Podfile.properties.json")) rescue {}

Pod::Spec.new do |s|
  s.name           = 'ExpoSQLite'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '15.1',
    :osx => '11.0'
  }
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'

  # Copy SQLite vendored sources to the ios directory,
  # since CocoaPods does not support source_files outside of the pod's directory.
  def s.vendor_sqlite_src!(useSQLCipher)
    vendor_src = useSQLCipher ? 'sqlcipher' : 'sqlite3'
    files = [
      'sqlite3.c',
      'sqlite3.h',
    ]
    files.each do |file|
      source = File.join(__dir__, '..', 'vendor', vendor_src, file)
      destination = File.join(__dir__, '..', 'ios', file)
      FileUtils.cp(source, destination)
    end
  end

  sqlite_cflags = '-DHAVE_USLEEP=1 -DSQLITE_ENABLE_LOCKING_STYLE=0 -DSQLITE_ENABLE_BYTECODE_VTAB=1'
  unless podfile_properties['expo.sqlite.enableFTS'] === 'false'
    sqlite_cflags << ' -DSQLITE_ENABLE_FTS4=1 -DSQLITE_ENABLE_FTS3_PARENTHESIS=1 -DSQLITE_ENABLE_FTS5=1'
  end

  if podfile_properties['expo.sqlite.useSQLCipher'] === 'true'
    s.vendor_sqlite_src!(true)
    # SQLCipher will have build error in sqlite3.c on debug build without the `-DNDEBUG`
    sqlite_cflags << ' -DSQLITE_HAS_CODEC=1 -DSQLCIPHER_CRYPTO_CC -DNDEBUG'
  else
    s.vendor_sqlite_src!(false)
  end

  if podfile_properties['expo.sqlite.customBuildFlags']
    sqlite_cflags << " " << podfile_properties['expo.sqlite.customBuildFlags']
  end
  Pod::UI.message("SQLite build flags: #{sqlite_cflags}")

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'OTHER_CFLAGS' => '$(inherited) ' + sqlite_cflags,
  }

  s.source_files = "**/*.{c,h,m,swift}"
  s.ios.vendored_frameworks = 'crsqlite.xcframework'
end
