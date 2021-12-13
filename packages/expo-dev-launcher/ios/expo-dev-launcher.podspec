require "json"

package = JSON.parse(File.read(File.join(__dir__, "../package.json")))

Pod::Spec.new do |s|
  s.name           = 'expo-dev-launcher'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '11.0'
  s.swift_version  = '5.2'
  s.source         = { :git => 'https://github.com/github_account/expo-development-client.git', :tag => "#{s.version}" }
  s.static_framework = true
  s.source_files   = '**/*.{h,m,swift,cpp}'
  s.preserve_paths = '**/*.{h,m,swift}'
  s.exclude_files  = 'Unsafe/**/*.{h,m,mm,swift,cpp}', 'Tests/**/*.{h,m,swift}'
  s.requires_arc   = true
  s.header_dir     = 'EXDevLauncher'

  s.resource_bundles = {
    'EXDevLauncher' => [
      'assets',
      'main.jsbundle',
      'Views/EXDevLauncherErrorView.storyboard'
    ]
  }

  s.xcconfig = {
    'GCC_PREPROCESSOR_DEFINITIONS' => "EX_DEV_LAUNCHER_ENABLED=1 EX_DEV_LAUNCHER_VERSION=#{s.version}",
    'OTHER_SWIFT_FLAGS' => '-DEX_DEV_LAUNCHER_ENABLED=1'
  }

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = { "DEFINES_MODULE" => "YES" }
  
  s.dependency "React-Core"
  s.dependency "expo-dev-menu-interface"
  s.dependency "EXManifests"
  s.dependency "EXUpdatesInterface"
  
  s.subspec 'Unsafe' do |unsafe|
    unsafe.source_files = 'Unsafe/**/*.{h,m,mm,swift,cpp}'
    unsafe.compiler_flags = '-x objective-c++ -std=c++1z -fno-objc-arc' # Disable Automatic Reference Counting
  end
  
  s.subspec 'Main' do |main|
    main.dependency "expo-dev-launcher/Unsafe"
  end

  s.test_spec 'Tests' do |test_spec|
    test_spec.platform     = :ios, '12.0'
    test_spec.source_files = 'Tests/**/*.{h,m,swift}'
    test_spec.dependency 'Quick'
    test_spec.dependency 'Nimble'
    test_spec.dependency "React-CoreModules"
    test_spec.dependency "OHHTTPStubs"
  end
  
  s.default_subspec = 'Main'
end
