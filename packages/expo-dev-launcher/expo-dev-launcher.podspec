require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name           = 'expo-dev-launcher'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '12.0'
  s.swift_version  = '5.2'
  s.source         = { :git => 'https://github.com/github_account/expo-development-client.git', :tag => "#{s.version}" }
  s.static_framework = true
  s.source_files   = 'ios/**/*.{h,m,swift,cpp}'
  s.preserve_paths = 'ios/**/*.{h,m,swift}'
  s.exclude_files  = 'ios/Unsafe/**/*.{h,m,mm,swift,cpp}', 'ios/Tests/**/*.{h,m,swift}'
  s.requires_arc   = true
  s.header_dir     = 'EXDevLauncher'

  s.resource_bundles = {
    'EXDevLauncher' => [
      'ios/assets',
      'ios/main.jsbundle',
      'ios/Views/EXDevLauncherErrorView.storyboard'
    ]
  }

  s.xcconfig = {
    'GCC_PREPROCESSOR_DEFINITIONS' => "EX_DEV_LAUNCHER_VERSION=#{s.version}"
  }

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = { "DEFINES_MODULE" => "YES" }
  dev_launcher_url = ENV['EX_DEV_LAUNCHER_URL'] || ""
  if dev_launcher_url != ""
    escaped_dev_launcher_url = Shellwords.escape(dev_launcher_url).gsub('/','\\/')
    s.pod_target_xcconfig = {
      'DEFINES_MODULE' => 'YES',
      'OTHER_CFLAGS[config=Debug]' => "$(inherited) -DEX_DEV_LAUNCHER_URL=\"\\\"" + escaped_dev_launcher_url + "\\\"\""
    }
  end

  s.user_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "\"${PODS_CONFIGURATION_BUILD_DIR}/expo-dev-launcher/Swift Compatibility Header\"",
  }
  
  s.dependency "React-Core"
  s.dependency "expo-dev-menu-interface"
  s.dependency "EXManifests"
  s.dependency "EXUpdatesInterface"
  s.dependency "expo-dev-menu"
  s.dependency "ExpoModulesCore"
  
  s.subspec 'Unsafe' do |unsafe|
    unsafe.source_files = 'ios/Unsafe/**/*.{h,m,mm,swift,cpp}'
    unsafe.compiler_flags = '-x objective-c++ -std=c++1z -fno-objc-arc' # Disable Automatic Reference Counting
  end
  
  s.subspec 'Main' do |main|
    main.dependency "expo-dev-launcher/Unsafe"
  end

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'ios/Tests/**/*.{h,m,swift}'
    test_spec.dependency 'Quick'
    test_spec.dependency 'Nimble'
    test_spec.dependency "React-CoreModules"
    test_spec.dependency "OHHTTPStubs"
  end
  
  s.default_subspec = 'Main'

end
