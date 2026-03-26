# Overrides CocoaPods `Installer`/'Podfile' classes to patch podspecs on the fly
# See: https://github.com/CocoaPods/CocoaPods/blob/master/lib/cocoapods/installer.rb
# See: https://github.com/CocoaPods/Core/blob/master/lib/cocoapods-core/podfile.rb#L160
#
# This is necessary to disable `USE_FRAMEWORKS` for specific pods that include
# React Native Core headers in their public headers, which causes issues when
# building them as dynamic frameworks with modular headers enabled.

require_relative '../precompiled_modules'

module Pod
  class Podfile
    public

    def framework_modules_to_patch
      @framework_modules_to_patch ||= ['ExpoModulesCore', 'ExpoModulesJSI', 'Expo', 'ReactAppDependencyProvider', 'expo-dev-menu']
    end

    def expo_add_modules_to_patch(modules)
      framework_modules_to_patch.concat(modules)
    end
  end

  class Installer
    private

    _original_run_podfile_pre_install_hooks = instance_method(:run_podfile_pre_install_hooks)

    public

    define_method(:perform_post_install_actions) do

      # Call original implementation first
      _original_perform_post_install_actions.bind(self).()

      # Expo workaround for Codegen in React Native where it uses the wrong output path for
      # the generated files. This can be removed when the following PR is merged and released upstream:
      # https://github.com/facebook/react-native/pull/54066
      # TODO: chrfalch - remove when RN PR is released
      react_codegen_native_target = self.pods_project.targets.find { |target| target.name == 'ReactCodegen' }

      if react_codegen_native_target
        already_exists = react_codegen_native_target.build_phases.any? do |phase|
          phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase) && phase.name == _script_phase_name
        end

        if !already_exists
          Pod::UI.puts "[Expo] ".blue + "Adding '#{_script_phase_name}' build phase to ReactCodegen"

          phase = react_codegen_native_target.new_shell_script_build_phase(_script_phase_name)
          phase.shell_path = '/bin/sh'
          phase.shell_script = <<~SH
            # Remove this step when the fix is merged and released.
            # See: https://github.com/facebook/react-native/pull/54066

            # This re-runs Codegen without the broken "scripts/react_native_pods_utils/script_phases.sh" script, causing Codegen to run without autolinking.
            # Instead of using "script_phases.sh" which always runs inside DerivedData, we run it in the normal "/ios" folder
            # See: https://github.com/facebook/react-native/blob/main/packages/react-native/scripts/react_native_pods_utils/script_phases.sh
            pushd "$PODS_ROOT/../" > /dev/null
              RCT_SCRIPT_POD_INSTALLATION_ROOT="$PODS_ROOT/.."
            popd >/dev/null

            export RCT_SCRIPT_RN_DIR="$REACT_NATIVE_PATH" # This is set by Expo
            export RCT_SCRIPT_APP_PATH="$RCT_SCRIPT_POD_INSTALLATION_ROOT/.."
            export RCT_SCRIPT_OUTPUT_DIR="$RCT_SCRIPT_POD_INSTALLATION_ROOT"
            export RCT_SCRIPT_TYPE="withCodegenDiscovery"

            # This is the broken script that runs inside DerivedData, meaning it can't find the autolinking result in `ios/build/generated/autolinking.json`.
            # Resulting in Codegen running with it's own autolinking, not discovering transitive peer dependencies.
            # export SCRIPT_PHASES_SCRIPT="$RCT_SCRIPT_RN_DIR/scripts/react_native_pods_utils/script_phases.sh"
            export WITH_ENVIRONMENT="$RCT_SCRIPT_RN_DIR/scripts/xcode/with-environment.sh"

            # Start of workaround code

            # Load the $NODE_BINARY from the "with-environment.sh" script
            source "$WITH_ENVIRONMENT"

            # Run this script directly in the right folders:
            # https://github.com/facebook/react-native/blob/3f7f9d8fb8beb41408d092870a7c7cac58029a4d/packages/react-native/scripts/react_native_pods_utils/script_phases.sh#L96-L101
            pushd "$RCT_SCRIPT_RN_DIR" >/dev/null || exit 1
              set -x
              "$NODE_BINARY" "scripts/generate-codegen-artifacts.js" --path "$RCT_SCRIPT_APP_PATH" --outputPath "$RCT_SCRIPT_OUTPUT_DIR" --targetPlatform "ios"
              set +x
            popd >/dev/null || exit 1

            # End of workaround code
          SH

          compile_sources_index = react_codegen_native_target.build_phases.find_index do |p|
            p.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase)
          end

          if compile_sources_index
            react_codegen_native_target.build_phases.delete(phase)
            react_codegen_native_target.build_phases.insert(compile_sources_index, phase)
          else
            Pod::UI.puts "[Expo] ".yellow + "Could not find 'Compile Sources' phase, build phase added at default position"
          end
        end
      else
        Pod::UI.puts "[Expo] ".yellow + "ReactCodegen target not found in pods project"
      end

      # Run all precompiled module post-install configuration
      Expo::PrecompiledModules.perform_post_install(self)
    end

    define_method(:run_podfile_pre_install_hooks) do
      _original_run_podfile_pre_install_hooks.bind(self).()

      # Disable use_frameworks! for pods that can't be built as frameworks
      Expo::PrecompiledModules.perform_pre_install(self)
    end
  end
end
