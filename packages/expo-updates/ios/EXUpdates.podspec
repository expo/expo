require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'EXUpdates'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '12.0'
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'React-Core'
  s.dependency 'EXStructuredHeaders'
  s.dependency 'EXUpdatesInterface'
  s.dependency 'EXManifests'

  s.pod_target_xcconfig = {
    'GCC_TREAT_INCOMPATIBLE_POINTER_TYPE_WARNINGS_AS_ERRORS' => 'YES',
    'GCC_TREAT_IMPLICIT_FUNCTION_DECLARATIONS_AS_ERRORS' => 'YES',
    'DEFINES_MODULE' => 'YES',
  }

  if !$ExpoUseSources&.include?(package['name']) && ENV['EXPO_USE_SOURCE'].to_i == 0 && File.exist?("#{s.name}.xcframework") && Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.10.0')
    s.source_files = "#{s.name}/**/*.h"
    s.vendored_frameworks = "#{s.name}.xcframework"
  else
    s.source_files = "#{s.name}/**/*.{h,m,swift}"
  end

  if $expo_updates_create_manifest != false
    s.script_phase = {
      :name => 'Generate app.manifest for expo-updates',
      :script => 'bash -l -c "$PODS_TARGET_SRCROOT/../scripts/create-manifest-ios.sh"',
      :execution_position => :before_compile
    }

    # Generate EXUpdates.bundle without existing resources
    # `create-manifest-ios.sh` will generate app.manifest in EXUpdates.bundle
    s.resource_bundles = {
      'EXUpdates' => []
    }
  end

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'Tests/*.{h,m,swift}'
    test_spec.dependency 'OCMockito', '~> 6.0'
  end
end
