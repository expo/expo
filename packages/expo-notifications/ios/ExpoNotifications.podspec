require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoNotifications'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.resource_bundles = {'ExpoNotifications_privacy' => ['PrivacyInfo.xcprivacy']}

  s.source_files = "#{s.name}/**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.exclude_files = 'Tests/'
  s.app_spec 'TestsApp' do |app_spec|
    app_spec.source_files = 'TestsApp/**/*.swift'
    app_spec.libraries = 'c++'
    app_spec.info_plist = {
      'UIApplicationSceneManifest' => {
        'UIApplicationSupportsMultipleScenes' => false,
        'UISceneConfigurations' => {
          'UIWindowSceneSessionRoleApplication' => [{
            'UISceneConfigurationName' => 'Default Configuration',
            'UISceneDelegateClassName' => '$(PRODUCT_MODULE_NAME).SceneDelegate'
          }]
        }
      }
    }
  end

  s.test_spec 'Tests' do |test_spec|
    test_spec.requires_app_host = true
    test_spec.app_host_name = 'ExpoNotifications/TestsApp'
    test_spec.dependency 'ExpoNotifications/TestsApp'
    test_spec.dependency 'ExpoModulesTestCore'

    test_spec.source_files = "Tests/**/*.{m,mm,swift}"

    test_spec.pod_target_xcconfig = {
      'OTHER_LDFLAGS' => '$(inherited) -lc++'
    }
  end
end
