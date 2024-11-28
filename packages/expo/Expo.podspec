require 'json'
require 'colored2' # dependency of CocoaPods

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

# Use a global flag to check whether the warning about missing autolinking
# scripts has already been printed. The podspec may be read multiple times
# during `pod install` and we don't want to make the warning more obtrusive.
$expo_warned_about_missing_autolinking |= false

Pod::Spec.new do |s|
  s.name           = 'Expo'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms       = {
    :ios => '15.1',
    :osx => '10.15',
    :tvos => '15.1'
  }
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.header_dir     = 'Expo'

  # Don't require the `ExpoModulesCore` dependency if the autolinking hasn't been imported.
  # Otherwise, `pod install` would fail because it's not linkable by the community CLI.
  if defined?(use_expo_modules!)
    s.dependency 'ExpoModulesCore'
  elsif !$expo_warned_about_missing_autolinking
    puts <<~EOS

    Your project includes the Expo package, but React Native Community CLI is unable to install the related Pods.
    Make sure to require autolinking scripts from Expo and call `use_expo_modules!` in your target.
    Learn more: https://docs.expo.dev/bare/installing-expo-modules
    EOS
    .yellow

    # Suppress the warning next time.
    $expo_warned_about_missing_autolinking = true
  end

  s.source_files = 'ios/**/*.{h,m,swift}'
  s.user_target_xcconfig = {
    'HEADER_SEARCH_PATHS' => '"${PODS_CONFIGURATION_BUILD_DIR}/Expo/Swift Compatibility Header"',
  }
end
