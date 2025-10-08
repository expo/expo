require 'json'

module EnvHelper
  def self.env_true?(value)
    ENV[value] == '1' || ENV[value]&.downcase == 'true'
  end
end

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))
isLogBoxEnabled = EnvHelper.env_true?("EXPO_UNSTABLE_LOG_BOX")

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

  extraCompilerFlags = '$(inherited)' \
    + (EnvHelper.env_true?("EXPO_DEVELOP_LOG_BOX") ? " -DEXPO_DEVELOP_LOG_BOX" : "") \
    + (EnvHelper.env_true?("EXPO_DEBUG_LOG_BOX") ? " -DEXPO_DEBUG_LOG_BOX" : "") \
    + (isLogBoxEnabled ? " -DEXPO_UNSTABLE_LOG_BOX" : "")

  s.compiler_flags = extraCompilerFlags
  s.pod_target_xcconfig = {
    'OTHER_SWIFT_FLAGS' => extraCompilerFlags,
  }

  s.dependency "React-Core"

  s.source_files = 'ios/**/*.{h,m,mm,swift}'

  if isLogBoxEnabled
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
      # NOTE: `s.resource_bundles` produces the ExpoLogBox.bundle and so it can't be defined here.
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
end
