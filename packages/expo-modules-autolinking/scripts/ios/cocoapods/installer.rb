# Overrides CocoaPods `Installer`/'Podfile' classes to patch podspecs on the fly
# See: https://github.com/CocoaPods/CocoaPods/blob/master/lib/cocoapods/installer.rb
# See: https://github.com/CocoaPods/Core/blob/master/lib/cocoapods-core/podfile.rb#L160
#
# This is necessary to disable `USE_FRAMEWORKS` for specific pods that include
# React Native Core headers in their public headers, which causes issues when
# building them as dynamic frameworks with modular headers enabled.

module Pod
  class Podfile
    public

    def framework_modules_to_patch
      @framework_modules_to_patch ||= ['ExpoModulesCore', 'Expo', 'ReactAppDependencyProvider', 'expo-dev-menu']
    end

    def expo_add_modules_to_patch(modules)
      framework_modules_to_patch.concat(modules)
    end
  end

  class Installer
    private

    _original_perform_post_install_actions = instance_method(:perform_post_install_actions)
    _original_run_podfile_pre_install_hooks = instance_method(:run_podfile_pre_install_hooks)
    _script_phase_name = '[Expo Autolinking] Run Codegen with autolinking'

    public

    define_method(:perform_post_install_actions) do

      # Call original implementation first
      _original_perform_post_install_actions.bind(self).()

      # Next we'll perform an Expo workaround for Codegen in React Native where it uses the wrong output path for
      # the generated files. This can be remove when the following PR is merged and released upstream:
      # https://github.com/facebook/react-native/pull/54066
      # TODO: chrfalch - remove when RN PR is released
      # Find the ReactCodegen pod target in the pods project
      react_codegen_native_target = self.pods_project.targets.find { |target| target.name == 'ReactCodegen' }

      if react_codegen_native_target
        # Check if the build phase already exists
        already_exists = react_codegen_native_target.build_phases.any? do |phase|
          phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase) && phase.name == _script_phase_name
        end

        if !already_exists
          Pod::UI.puts "[Expo] ".blue + "Adding '#{_script_phase_name}' build phase to ReactCodegen"

          # Create the new shell script build phase
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

          # Find the index of the "Compile Sources" phase (PBXSourcesBuildPhase)
          compile_sources_index = react_codegen_native_target.build_phases.find_index do |p|
            p.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase)
          end

          if compile_sources_index
            # Remove the phase from its current position (it was added at the end)
            react_codegen_native_target.build_phases.delete(phase)
            # Insert it before the "Compile Sources" phase
            react_codegen_native_target.build_phases.insert(compile_sources_index, phase)
          else
            Pod::UI.puts "[Expo] ".yellow + "Could not find 'Compile Sources' phase, build phase added at default position"
          end
        end
      else
        Pod::UI.puts "[Expo] ".yellow + "ReactCodegen target not found in pods project"
      end
    end

    define_method(:run_podfile_pre_install_hooks) do
      # Call original implementation first
      _original_run_podfile_pre_install_hooks.bind(self).()

      return unless should_disable_use_frameworks_for_core_expo_pods?()

      # Disable USE_FRAMEWORKS in core targets when USE_FRAMEWORKS is set
      # This method overrides the build_type field to always use static_library for
      # the following pod targets:
      # - ExpoModulesCore, Expo, ReactAppDependencyProvider, expo-dev-menu
      # These are all including files from React Native Core in their public header files,
      # which causes their own modular headers to be invalid.
      Pod::UI.puts "[Expo] ".blue + "Disabling USE_FRAMEWORKS for modules #{@podfile.framework_modules_to_patch.join(', ')}"
      self.pod_targets.each do |t|
        if @podfile.framework_modules_to_patch.include?(t.name)
          def t.build_type
            Pod::BuildType.static_library
          end
        end
      end
    end

    private

    # We should only disable USE_FRAMEWORKS for specific pods when:
    # - RCT_USE_PREBUILT_RNCORE is not '1'
    # - USE_FRAMEWORKS is not set
    def should_disable_use_frameworks_for_core_expo_pods?()
      return false if ENV['RCT_USE_PREBUILT_RNCORE'] != '1'
      return true if get_linkage?() != nil
      false
    end

    # Returns the linkage type if USE_FRAMEWORKS is set, otherwise returns nil
    def get_linkage?()
      return nil if ENV["USE_FRAMEWORKS"] == nil
      return :dynamic if ENV["USE_FRAMEWORKS"].downcase == 'dynamic'
      return :static if ENV["USE_FRAMEWORKS"].downcase == 'static'
      nil
    end
  end
end
