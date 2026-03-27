require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'EXStructuredHeaders'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1',
    :osx => '11.0'
  }
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.source_files = "#{s.name}/**/*.{h,m}"

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'Tests/*.{h,m,swift}'
  end
end
