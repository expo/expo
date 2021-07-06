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
  s.source_files   = 'ios/**/*.{h,m,swift}'
  s.preserve_paths = 'ios/**/*.{h,m,swift}'
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

  s.dependency 'React'
  s.dependency 'expo-dev-menu-interface'
  
  s.subspec 'Vendored' do |vendored|
    vendored.source_files = 'vendored/**/*.{h,m}'
    vendored.private_header_files = 'vendored/**/*.h'
    vendored.compiler_flags = '-w -Xanalyzer -analyzer-disable-all-checks'
  end
  
  s.subspec 'Main' do |main|
    main.dependency "expo-dev-menu/Vendored"
  end
  
  s.default_subspec = 'Main'
end
