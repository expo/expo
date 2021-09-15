require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ABI42_0_0ExpoModulesCore'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '11.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }

  s.dependency 'ABI42_0_0UMCore'

  s.subspec 'Core' do |ss|
    ss.source_files = '**/*.{h,m}'
    ss.exclude_files = 'Interfaces/'
  end

  s.subspec 'Interfaces' do |ss|
    ss.source_files = 'Interfaces/**/*.{h,m}'
    ss.dependency 'ABI42_0_0ExpoModulesCore/Core'
  end
end
