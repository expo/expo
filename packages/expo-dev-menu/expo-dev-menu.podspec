require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'expo-dev-menu'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '11.0'
  s.swift_version  = '5.2'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.source_files   = 'ios/**/*.{h,m,swift}'
  s.preserve_paths = 'ios/**/*.{h,m,swift}'
  s.exclude_files  = 'ios/*Tests/**'
  s.requires_arc   = true
  s.header_dir     = 'EXDevMenu'

  s.resource_bundles = { 'EXDevMenu' => [
    'assets/*.ios.js',
    'assets/dev-menu-packager-host',
    'assets/*.ttf'
  ]}

  s.xcconfig = { 'GCC_PREPROCESSOR_DEFINITIONS' => 'EX_DEV_MENU_ENABLED=1', 'OTHER_SWIFT_FLAGS' => '-DEX_DEV_MENU_ENABLED=1' }

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = { "DEFINES_MODULE" => "YES" }

  s.dependency 'React-Core'
  s.dependency 'expo-dev-menu-interface'
  
  s.subspec 'Vendored' do |vendored|
    vendored.source_files = 'vendored/**/*.{h,m}'
    vendored.private_header_files = 'vendored/**/*.h'
    vendored.compiler_flags = '-w -Xanalyzer -analyzer-disable-all-checks'
  end
  
  s.subspec 'Main' do |main|
    main.dependency "expo-dev-menu/Vendored"
  end
  
  s.test_spec 'Tests' do |test_spec|
    test_spec.requires_app_host = false
    test_spec.source_files = 'ios/Tests/**'
    test_spec.dependency 'React-CoreModules'
    test_spec.platform = :ios, '12.0'
  end
  
  s.test_spec 'UITests' do |test_spec|
    test_spec.requires_app_host = true
    test_spec.source_files = 'ios/UITests/**'
    test_spec.dependency 'React-CoreModules'
    test_spec.dependency 'React'
    test_spec.platform = :ios, '12.0'
  end
  
  s.default_subspec = 'Main'
end
