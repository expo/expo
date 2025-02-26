require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'EXConstants'
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
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  if !$ExpoUseSources&.include?(package['name']) && ENV['EXPO_USE_SOURCE'].to_i == 0 && File.exist?("#{s.name}.xcframework") && Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.10.0')
    s.source_files = "**/*.h"
    s.vendored_frameworks = "#{s.name}.xcframework"
  else
    s.source_files = "**/*.{h,m,swift}"
  end

  script_phase = {
    :name => 'Generate app.config for prebuilt Constants.manifest',
    :script => 'bash -l -c "$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh"',
    :execution_position => :before_compile
  }
  # :always_out_of_date is only available in CocoaPods 1.13.0 and later
  if Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.13.0')
    # always run the script without warning
    script_phase[:always_out_of_date] = "1"
  end
  s.script_phase = script_phase

  # Generate EXConstants.bundle without existing resources
  # `get-app-config-ios.sh` will generate app.config in EXConstants.bundle
  s.resource_bundles = {
    'EXConstants' => [],
    'ExpoConstants_privacy' => ['PrivacyInfo.xcprivacy']
  }

end
