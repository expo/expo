require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoSQLite'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '13.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  if !$ExpoUseSources&.include?(package['name']) && ENV['EXPO_USE_SOURCE'].to_i == 0 && File.exist?("#{s.name}.xcframework") && Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.10.0')
    s.source_files = "**/*.h"
    s.vendored_frameworks = "#{s.name}.xcframework"
  else
    s.source_files = "**/*.{h,m,swift}"
  end
end
