require 'json'

module EnvHelper
  def self.env_true?(value)
    ENV[value] == '1' || ENV[value]&.downcase == 'true'
  end
end

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))
# Should ExpoLogBox.bundle be packaged with the app?
isEnabled = EnvHelper.env_true?("EXPO_UNSTABLE_LOG_BOX")
# Should the UI be loaded from development server?
isDevelop = EnvHelper.env_true?("EXPO_DEVELOP_LOG_BOX")
# Should the RedBox replacement WebView be inspectable?
isDebug = EnvHelper.env_true?("EXPO_DEBUG_LOG_BOX")

shouldBuild = File.exist?(File.join(__dir__, '.bundle-on-demand'))

Pod::Spec.new do |s|
  s.name           = 'ExpoLogBox'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms       = {
    :ios => '16.4',
    :osx => '11.0',
    :tvos => '16.4'
  }
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true

  extraCompilerFlags = '$(inherited)' \
    + (isDevelop ? " -DEXPO_DEVELOP_LOG_BOX" : "") \
    + (isDebug ? " -DEXPO_DEBUG_LOG_BOX" : "") \
    + (isEnabled ? " -DEXPO_UNSTABLE_LOG_BOX" : "")

  s.compiler_flags = extraCompilerFlags
  s.pod_target_xcconfig = {
    'OTHER_SWIFT_FLAGS' => extraCompilerFlags,
  }

  s.dependency "React-Core"

  s.source_files = 'ios/**/*.{h,m,mm,swift}'

  if isEnabled
    if shouldBuild
      build_bundle_script = {
        :name => 'Build ExpoLogBox Bundle',
        :script => %Q{
          echo "Building ExpoLogBox.bundle..."
          #{__dir__}/scripts/with-node.sh #{__dir__}/scripts/build-bundle.mjs
        },
        :execution_position => :before_compile,
        # NOTE(@krystofwoldrich): Ideally we would specify `__dir__/**/*`, but Xcode doesn't support patterns
        :input_files  => ["#{__dir__}/package.json"],
        :output_files  => ["#{__dir__}/dist/ExpoLogBox.bundle"],
      }
    end
    copy_bundle_script = {
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
      copy_bundle_script[:always_out_of_date] = "1"
    end
    s.script_phases = shouldBuild ? [build_bundle_script, copy_bundle_script] : [copy_bundle_script]
    s.resource_bundles = {
      'ExpoLogBox' => [],
    }
  end
end
