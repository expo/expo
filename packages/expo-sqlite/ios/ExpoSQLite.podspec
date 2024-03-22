require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
podfile_properties = JSON.parse(File.read("#{Pod::Config.instance.installation_root}/Podfile.properties.json")) rescue {}

sqliteVersion = '3.42.0'

Pod::Spec.new do |s|
  s.name           = 'ExpoSQLite'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '13.4'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'

  s.dependency 'sqlite3', "~> #{sqliteVersion}"
  unless podfile_properties['expo.sqlite.enableFTS'] === 'false'
    s.dependency 'sqlite3/fts', "~> #{sqliteVersion}"
    s.dependency 'sqlite3/fts5', "~> #{sqliteVersion}"
  end

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,swift}"
  s.vendored_frameworks = 'crsqlite.xcframework'
end
