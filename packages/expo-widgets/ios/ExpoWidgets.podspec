require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoWidgets'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '15.1'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'ExpoUI'

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

  project_root_env_var = ENV['PROJECT_ROOT'] ? "export PROJECT_ROOT=#{ENV['PROJECT_ROOT']}\n" : ""
  build_bundle_script = {
    :name => 'Build ExpoWidgets Bundle',
    :script => project_root_env_var + 'bash -l -c "$PODS_TARGET_SRCROOT/../scripts/xcode-build-bundle.sh"',
    :execution_position => :before_compile,
    # NOTE(@krystofwoldrich): Ideally we would specify `__dir__/**/*`, but Xcode doesn't support patterns
    :input_files  => ["#{__dir__}/../package.json"],
    :output_files  => ["#{__dir__}/../bundle/build/ExpoWidgets.bundle"],
  }
  copy_bundle_script = {
    :name => 'Prepare ExpoWidgets Resources',
    :script => %Q{
      echo "Preparing ExpoWidgets.bundle..."
      source="#{__dir__}/../bundle/build/ExpoWidgets.bundle"
      dest="${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/ExpoWidgets.bundle"
      echo "Copying ${source} to ${dest}"
      cp "${source}" "${dest}"
    },
    :execution_position => :before_compile,
    :input_files  => ["#{__dir__}/../bundle/build/ExpoWidgets.bundle"]
  }
  # :always_out_of_date is only available in CocoaPods 1.13.0 and later
  if Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.13.0')
    # always run the script without warning
    copy_bundle_script[:always_out_of_date] = "1"
  end
  s.script_phases = [build_bundle_script, copy_bundle_script]
  s.resource_bundles = {
    'ExpoWidgets' => [],
  }

end
