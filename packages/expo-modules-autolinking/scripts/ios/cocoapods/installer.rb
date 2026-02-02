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

    _original_perform_post_install_actions = instance_method(:perform_post_install_actions)
    _original_run_podfile_pre_install_hooks = instance_method(:run_podfile_pre_install_hooks)

    public

    define_method(:perform_post_install_actions) do

      # Call original implementation first
      _original_perform_post_install_actions.bind(self).()

      # Codegen workaround: Re-run codegen from the correct directory.
      # This fixes an issue where React Native's codegen runs from DerivedData
      # and can't find the autolinking.json file, resulting in missing third-party components.
      # This can be removed when the following PR is merged and released upstream:
      # https://github.com/facebook/react-native/pull/54066
      # TODO: chrfalch - remove when RN PR is released
      configure_codegen_workaround()

      # Add early exit to RN's Generate Specs phase to prevent it from running on every build.
      # The RN script uses fs.writeFileSync which touches file timestamps even when content is unchanged,
      # causing full recompilation on every incremental build.
      add_early_exit_to_rn_codegen()

      # TODO(ExpoModulesJSI-xcframework): Remove this call when ExpoModulesJSI.xcframework
      # is built and distributed separately.
      # Configure header search paths for prebuilt XCFrameworks
      # This ensures that pods can find ExpoModulesJSI headers when using prebuilt modules
      Expo::PrecompiledModules.configure_header_search_paths(self)

      # Configure ReactCodegen to handle prebuilt modules properly.
      # This removes codegen source files for prebuilt libraries and adds a cleanup script phase.
      Expo::PrecompiledModules.configure_codegen_for_prebuilt_modules(self)
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

    # Codegen workaround: Adds a script phase that re-runs codegen from the correct directory.
    # React Native's codegen script runs from DerivedData and can't find autolinking.json,
    # so we add our own phase that runs from the ios/ folder where autolinking.json exists.
    def configure_codegen_workaround()
      react_codegen_target = self.pods_project.targets.find { |target| target.name == 'ReactCodegen' }

      unless react_codegen_target
        Pod::UI.puts "[Expo] ".yellow + "ReactCodegen target not found in pods project"
        return
      end

      script_phase_name = '[Expo Autolinking] Run Codegen with autolinking'

      # Check if the build phase already exists
      already_exists = react_codegen_target.build_phases.any? do |phase|
        phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase) && phase.name == script_phase_name
      end

      return if already_exists

      Pod::UI.puts "[Expo] ".blue + "Adding '#{script_phase_name}' build phase to ReactCodegen"

      phase = react_codegen_target.new_shell_script_build_phase(script_phase_name)
      phase.shell_path = '/bin/sh'
      phase.shell_script = <<~SH
        # Remove this step when the fix is merged and released.
        # See: https://github.com/facebook/react-native/pull/54066

        # This re-runs Codegen without the broken "scripts/react_native_pods_utils/script_phases.sh" script, causing Codegen to run without autolinking.
        # Instead of using "script_phases.sh" which always runs inside DerivedData, we run it in the normal "/ios" folder
        # See: https://github.com/facebook/react-native/blob/main/packages/react-native/scripts/react_native_pods_utils/script_phases.sh

        # ========== [Expo] Early exit check ==========
        # Skip codegen if autolinking.json hasn't changed since last run.
        # This avoids re-running Node.js codegen on every incremental build.
        # NOTE: We use $PODS_ROOT/../build/ instead of $DERIVED_FILE_DIR because
        # Xcode's $DERIVED_FILE_DIR path changes between builds (Index.noindex vs Build),
        # causing the hash file to not be found on subsequent builds.
        AUTOLINKING_JSON="$PODS_ROOT/../build/generated/autolinking/autolinking.json"
        HASH_DIR="$PODS_ROOT/../build/generated/.expo-codegen-cache"
        LAST_AUTOLINKING_HASH="$HASH_DIR/.expo_autolinking_codegen_hash"
        STAMP_FILE="$DERIVED_FILE_DIR/expo-codegen-autolinking.stamp"

        if [ -f "$AUTOLINKING_JSON" ] && [ -f "$LAST_AUTOLINKING_HASH" ]; then
          CURRENT_HASH=$(md5 -q "$AUTOLINKING_JSON" 2>/dev/null || md5sum "$AUTOLINKING_JSON" | cut -d' ' -f1)
          PREVIOUS_HASH=$(cat "$LAST_AUTOLINKING_HASH" 2>/dev/null || echo "")
          if [ "$CURRENT_HASH" = "$PREVIOUS_HASH" ]; then
            echo "[Expo] Skipping codegen - autolinking.json unchanged (hash: $CURRENT_HASH)"
            # Touch the stamp file for Xcode dependency tracking
            mkdir -p "$DERIVED_FILE_DIR"
            touch "$STAMP_FILE"
            exit 0
          fi
        fi
        # =============================================

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

        # ========== [Expo] Save autolinking hash ==========
        mkdir -p "$HASH_DIR"
        mkdir -p "$DERIVED_FILE_DIR"
        if [ -f "$AUTOLINKING_JSON" ]; then
          md5 -q "$AUTOLINKING_JSON" 2>/dev/null > "$LAST_AUTOLINKING_HASH" || md5sum "$AUTOLINKING_JSON" | cut -d' ' -f1 > "$LAST_AUTOLINKING_HASH"
        fi
        touch "$STAMP_FILE"
        # ==================================================

        # End of workaround code
      SH

      # Add input/output files to enable Xcode dependency analysis
      phase.input_paths = ['$(PODS_ROOT)/../build/generated/autolinking/autolinking.json']
      phase.output_paths = ['$(DERIVED_FILE_DIR)/expo-codegen-autolinking.stamp']

      # Find the index of the "Compile Sources" phase (PBXSourcesBuildPhase)
      compile_sources_index = react_codegen_target.build_phases.find_index do |p|
        p.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase)
      end

      if compile_sources_index
        # Remove the phase from its current position (it was added at the end)
        react_codegen_target.build_phases.delete(phase)
        # Insert it before the "Compile Sources" phase
        react_codegen_target.build_phases.insert(compile_sources_index, phase)
      else
        Pod::UI.puts "[Expo] ".yellow + "Could not find 'Compile Sources' phase, build phase added at default position"
      end
    end

    # Adds early exit logic to React Native's [CP-User] Generate Specs phase.
    # RN's codegen uses fs.writeFileSync which updates file timestamps even when content hasn't changed,
    # causing Xcode to recompile all codegen files on every incremental build.
    # This workaround adds a hash-based check to skip the script when autolinking.json hasn't changed.
    def add_early_exit_to_rn_codegen()
      react_codegen_target = self.pods_project.targets.find { |target| target.name == 'ReactCodegen' }
      return unless react_codegen_target

      generate_specs_phase = react_codegen_target.build_phases.find do |phase|
        phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase) && phase.name == '[CP-User] Generate Specs'
      end

      return unless generate_specs_phase

      # Check if we've already modified this script (look for our marker comment)
      return if generate_specs_phase.shell_script.include?('[Expo] Early exit check')

      Pod::UI.puts "[Expo] ".blue + "Adding early exit check to '[CP-User] Generate Specs' build phase"

      early_exit_script = <<~SH
        # ========== [Expo] Early exit check ==========
        # Skip RN's codegen if autolinking.json hasn't changed since last run.
        # RN's generate-codegen-artifacts.js uses fs.writeFileSync which touches timestamps
        # even when content is unchanged, causing full recompilation on every build.
        # NOTE: We use a stable project-relative path for the hash file instead of $DERIVED_FILE_DIR
        # because Xcode changes $DERIVED_FILE_DIR between builds (Index.noindex vs Build paths).
        AUTOLINKING_JSON="$PODS_ROOT/../build/generated/autolinking/autolinking.json"
        HASH_DIR="$PODS_ROOT/../build/generated/.expo-codegen-cache"
        RN_CODEGEN_HASH_FILE="$HASH_DIR/.expo_rn_codegen_hash"

        if [ -f "$AUTOLINKING_JSON" ] && [ -f "$RN_CODEGEN_HASH_FILE" ]; then
          CURRENT_HASH=$(md5 -q "$AUTOLINKING_JSON" 2>/dev/null || md5sum "$AUTOLINKING_JSON" | cut -d' ' -f1)
          PREVIOUS_HASH=$(cat "$RN_CODEGEN_HASH_FILE" 2>/dev/null || echo "")
          if [ "$CURRENT_HASH" = "$PREVIOUS_HASH" ]; then
            echo "[Expo] Skipping RN codegen - autolinking.json unchanged (hash: $CURRENT_HASH)"
            exit 0
          fi
        fi
        # =============================================

      SH

      # Prepend our early exit check to the existing script
      generate_specs_phase.shell_script = early_exit_script + generate_specs_phase.shell_script

      # Also add the hash saving at the end - we need to wrap the original script
      hash_save_script = <<~SH

        # ========== [Expo] Save RN codegen hash ==========
        mkdir -p "$HASH_DIR"
        if [ -f "$AUTOLINKING_JSON" ]; then
          md5 -q "$AUTOLINKING_JSON" 2>/dev/null > "$RN_CODEGEN_HASH_FILE" || md5sum "$AUTOLINKING_JSON" | cut -d' ' -f1 > "$RN_CODEGEN_HASH_FILE"
        fi
        # =================================================
      SH

      generate_specs_phase.shell_script = generate_specs_phase.shell_script + hash_save_script

      # Save the changes
      self.pods_project.save
    end

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
