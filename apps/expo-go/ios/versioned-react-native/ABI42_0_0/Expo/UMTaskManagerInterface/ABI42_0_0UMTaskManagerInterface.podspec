require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ABI42_0_0UMTaskManagerInterface'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '11.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }

  s.dependency 'ABI42_0_0UMCore'

  s.source_files = 'ABI42_0_0UMTaskManagerInterface/**/*.{h,m}'
end
