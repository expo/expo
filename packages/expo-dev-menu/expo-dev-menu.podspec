require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

reactNativeVersion = '0.0.0'
begin
  reactNativeVersion = `node --print "require('react-native/package.json').version"`
rescue
  reactNativeVersion = '0.0.0'
end
reactNativeTargetVersion = reactNativeVersion.split('.')[1].to_i

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1 -Wno-comma -Wno-shorten-64-to-32'
compiler_flags = folly_compiler_flags + ' ' + "-DREACT_NATIVE_TARGET_VERSION=#{reactNativeTargetVersion}"
if ENV['USE_HERMES'] == nil || ENV['USE_HERMES'] == '1'
  compiler_flags += ' -DUSE_HERMES'
end

Pod::Spec.new do |s|
  s.name           = 'expo-dev-menu'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '15.1'
  }
  s.swift_version  = '5.2'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.requires_arc   = true
  s.header_dir     = 'EXDevMenu'

  s.resource_bundles = { 'EXDevMenu' => [
    'ios/assets',
    'assets/*.ios.js',
    'assets/dev-menu-packager-host',
    'assets/*.ttf',
    'assets/*.otf'
  ]}

  s.xcconfig = { 'GCC_PREPROCESSOR_DEFINITIONS' => 'EX_DEV_MENU_ENABLED=1', 'OTHER_SWIFT_FLAGS' => '-DEX_DEV_MENU_ENABLED' }

  s.user_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "\"${PODS_CONFIGURATION_BUILD_DIR}/expo-dev-menu/Swift Compatibility Header\"",
  }

  header_search_paths = [
    '"${PODS_ROOT}/Headers/Private/React-Core"',
    '"$(PODS_CONFIGURATION_BUILD_DIR)/ExpoModulesCore/Swift Compatibility Header"',
    '"$(PODS_CONFIGURATION_BUILD_DIR)/expo-dev-menu-interface/Swift Compatibility Header"',
  ]
  if ENV['USE_FRAMEWORKS']
    header_search_paths.concat([
      # [begin] transitive dependencies of React-RCTAppDelegate that are not defined modules
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-Mapbuffer/React_Mapbuffer.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-RuntimeApple/React_RuntimeApple.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-RuntimeCore/React_RuntimeCore.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jserrorhandler/React_jserrorhandler.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsinspectortracing/jsinspector_moderntracing.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-jsitooling/JSITooling.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-nativeconfig/React_nativeconfig.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-runtimescheduler/React_runtimescheduler.framework/Headers"',
      '"${PODS_CONFIGURATION_BUILD_DIR}/React-performancetimeline/React_performancetimeline.framework/Headers"',
      # [end] transitive dependencies of React-RCTAppDelegate that are not defined modules
    ])
  end
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++20',
    'HEADER_SEARCH_PATHS' => header_search_paths.join(' '),
  }
  unless defined?(install_modules_dependencies)
    # `install_modules_dependencies` is defined from react_native_pods.rb.
    # when running with `pod ipc spec`, this method is not defined and we have to require manually.
    require File.join(File.dirname(`node --print "require.resolve('react-native/package.json')"`), "scripts/react_native_pods")
  end
  install_modules_dependencies(s)

  s.subspec 'SafeAreaView' do |safearea|
    safearea.dependency 'ExpoModulesCore'

    # Swift/Objective-C compatibility
    safearea.pod_target_xcconfig = {
      'DEFINES_MODULE' => 'YES',
      'SWIFT_COMPILATION_MODE' => 'wholemodule'
    }
    if File.exist?("vendored/react-native-safe-area-context/dev-menu-react-native-safe-area-context.xcframework") && Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.10.0')
      safearea.source_files = "vendored/react-native-safe-area-context/**/*.{h}"
      safearea.vendored_frameworks = "vendored/react-native-safe-area-context/dev-menu-react-native-safe-area-context.xcframework"
      safearea.private_header_files = 'vendored/react-native-safe-area-context/**/*.h'
    else
      safearea.source_files = 'vendored/react-native-safe-area-context/**/*.{h,m,swift}'
      safearea.private_header_files = 'vendored/react-native-safe-area-context/**/*.h'

      safearea.compiler_flags = '-w -Xanalyzer -analyzer-disable-all-checks'
    end
  end

  s.subspec 'Vendored' do |vendored|
    vendored.dependency "expo-dev-menu/SafeAreaView"
  end

  s.subspec 'Main' do |main|
    s.source_files   = 'ios/**/*.{h,m,mm,swift}'
    s.preserve_paths = 'ios/**/*.{h,m,mm,swift}'
    s.exclude_files  = 'ios/*Tests/**/*', 'ios/ReactNativeCompatibles/**/*', 'vendored/**/*'
    s.compiler_flags = compiler_flags

    # add_dependency() requires to be defined
    main.pod_target_xcconfig = {}

    main.dependency 'React-Core'
    if ENV['USE_FRAMEWORKS'] && reactNativeTargetVersion >= 75
      add_dependency(main, "React-rendererconsistency")
    end
    add_dependency(main, "React-jsinspector", :framework_name => 'jsinspector_modern')
    main.dependency "EXManifests"
    main.dependency 'ExpoModulesCore'
    main.dependency 'expo-dev-menu-interface'
    main.dependency "expo-dev-menu/Vendored"
    main.dependency 'ReactAppDependencyProvider'
  end

  s.subspec 'ReactNativeCompatibles' do |ss|
    ss.source_files = 'ios/ReactNativeCompatibles/ReactNative/**/*'
    ss.compiler_flags = compiler_flags
    ss.dependency 'React-Core'
  end

  s.test_spec 'Tests' do |test_spec|
    test_spec.requires_app_host = false
    test_spec.source_files = 'ios/Tests/**/*'
    test_spec.dependency 'Quick'
    test_spec.dependency 'Nimble'
    test_spec.dependency 'React-CoreModules'
    # ExpoModulesCore requires React-hermes or React-jsc in tests, add ExpoModulesTestCore for the underlying dependencies
    test_spec.dependency 'ExpoModulesTestCore'
    test_spec.platforms = {
      :ios => '15.1'
    }
  end

  s.test_spec 'UITests' do |test_spec|
    test_spec.requires_app_host = true
    test_spec.source_files = 'ios/UITests/**/*'
    test_spec.dependency 'React-CoreModules'
    test_spec.dependency 'ReactAppDependencyProvider'
    test_spec.dependency 'React'
    test_spec.platforms = {
      :ios => '15.1'
    }
  end

  s.default_subspec = ['Main', 'ReactNativeCompatibles']
end
