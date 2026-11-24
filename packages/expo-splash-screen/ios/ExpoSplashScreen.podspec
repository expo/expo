require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoSplashScreen'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '16.4', :tvos => '16.4' }
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'React-FabricComponents'

  s.source_files = "**/*.{h,mm,swift}"
  s.private_header_files = 'SplashScreenSnapshot.h'

  unless defined?(install_modules_dependencies)
    # `install_modules_dependencies` is defined from react_native_pods.rb.
    # when running with `pod ipc spec`, this method is not defined and we have to require manually.
    require File.join(File.dirname(`node --print "require.resolve('react-native/package.json')"`), "scripts/react_native_pods")
  end

  s.compiler_flags = get_folly_config()[:compiler_flags]
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
  install_modules_dependencies(s)
end
