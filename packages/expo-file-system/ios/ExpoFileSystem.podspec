require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoFileSystem'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms       = {
    :ios => '16.4',
    :osx => '13.4',
    :tvos => '16.4'
  }
  s.swift_version  = '5.9'
  s.source         = { :git => 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.resource_bundles = {'ExpoFileSystem_privacy' => ['PrivacyInfo.xcprivacy']}

  s.source_files = "**/*.{h,m,swift}"
  s.exclude_files = 'Tests/'

  s.test_spec 'Tests' do |test_spec|
    # ExpoModulesCore requires React-hermes or React-jsc in tests.
    test_spec.dependency 'ExpoModulesTestCore'
    test_spec.source_files = 'Tests/**/*.{m,swift}'
    # Test bundles do not inherit ExpoModulesCore's user_target_xcconfig linker flags.
    test_spec.pod_target_xcconfig = {
      'OTHER_LDFLAGS' => '$(inherited) -lc++'
    }
  end
end
