require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoLogBox'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms       = {
    :ios => '15.1',
    :osx => '11.0',
    :tvos => '15.1'
  }
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.header_dir     = 'Expo'

  s.pod_target_xcconfig = {
    'OTHER_SWIFT_FLAGS' => '$(inherited)' + (ENV["EXPO_DEBUG_LOG_BOX"] == "1" ? " -DEXPO_DEBUG_LOG_BOX" : ""),
  }

  s.source_files = 'ios/**/*.{h,m,mm,swift}'
  script_phase = {
    :name => 'Prepare ExpoLogBox Resources',
    # NOTE(@krystofwoldrich): We might want to add a flag to always include the ExpoLogBox.bundle to cover unusual configurations.
    :script => %Q{
      echo "Preparing ExpoLogBox.bundle..."
      source="#{__dir__}/dist/ExpoLogBox.bundle/"
      dest="${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/ExpoLogBox.bundle/"
      if [ "${CONFIGURATION}" = "Debug" ]; then
        echo "Copying ${source} to ${dest}"
        mkdir -p "${dest}"
        rsync -a "${source}" "${dest}"
      fi
    },
    :execution_position => :before_compile,
    :input_files  => ["#{__dir__}/dist/ExpoLogBox.bundle"],
    # :output_files => ["${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/ExpoLogBox.bundle"],
  }
  # :always_out_of_date is only available in CocoaPods 1.13.0 and later
  if Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.13.0')
    # always run the script without warning
    script_phase[:always_out_of_date] = "1"
  end
  s.script_phase = script_phase
  s.resource_bundles = {
    'ExpoLogBox' => [],
  }
end
