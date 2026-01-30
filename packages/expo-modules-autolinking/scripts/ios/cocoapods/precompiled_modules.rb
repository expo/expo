# Handles precompiled XCFramework module integration for Expo.
#
# This module provides functionality to:
# 1. Link pods with prebuilt XCFrameworks instead of building from source
# 2. Discover which pods are using prebuilt XCFrameworks
# 3. Filter prebuilt libraries from React Native's codegen to avoid duplicate symbols
#
# When EXPO_USE_PRECOMPILED_MODULES=1 is set, packages with matching XCFrameworks
# in their .xcframeworks/<buildType>/ directory will be linked as vendored frameworks.
#
# XCFramework location: <package>/.xcframeworks/<buildType>/<PodName>.xcframework
# Example: packages/expo-modules-core/.xcframeworks/debug/ExpoModulesCore.xcframework

module Expo
  module PrecompiledModules
    # The environment variable that enables precompiled modules
    ENV_VAR = 'EXPO_USE_PRECOMPILED_MODULES'.freeze

    # Environment variable for build flavor override
    BUILD_FLAVOR_ENV_VAR = 'EXPO_PRECOMPILED_FLAVOR'.freeze

    # Environment variable for custom xcframeworks output path
    XCFRAMEWORKS_OUTPUT_PATH_ENV_VAR = 'EXPO_PREBUILD_OUTPUT_PATH'.freeze

    # The path to packages/external relative to the monorepo root
    EXTERNAL_PACKAGES_DIR = 'packages/external'.freeze

    # The xcframeworks directory name inside each package
    # Structure: <package>/.xcframeworks/<buildType>/<PodName>.xcframework
    XCFRAMEWORKS_DIR_NAME = '.xcframeworks'.freeze

    # Cache to track which pods have already been logged (to avoid duplicate output)
    @logged_pods = {}

    # Cache for the resolved xcframeworks base path
    @xcframeworks_base_path = nil

    class << self
      # Returns the build flavor (debug/release) for precompiled modules.
      # Defaults to 'debug', can be overridden via EXPO_PRECOMPILED_FLAVOR env var.
      def build_flavor
        ENV[BUILD_FLAVOR_ENV_VAR] || 'debug'
      end

      # Returns true if precompiled modules are enabled via environment variable
      def enabled?
        ENV[ENV_VAR] == '1'
      end

      # Tries to link a pod spec with a prebuilt XCFramework.
      #
      # Looks for the prebuilt framework inside the package directory:
      # <package>/.xcframeworks/<buildType>/<PodName>.xcframework
      #
      # @param spec [Pod::Spec] The podspec to potentially link with a prebuilt framework
      # @return [Boolean] true if a prebuilt framework was linked, false otherwise
      #
      # @example
      #   PrecompiledModules.try_link_with_prebuilt_xcframework(spec)
      #
      def try_link_with_prebuilt_xcframework(spec)
        return false unless enabled?

        # Get the podspec directory to find the xcframework
        podspec_dir = get_podspec_dir(spec)
        unless podspec_dir
          log_linking_status(spec.name, false, "could not determine podspec location")
          return false
        end

        # XCFramework is inside the package: .xcframeworks/<buildType>/<PodName>.xcframework
        xcframework_path = File.join(podspec_dir, XCFRAMEWORKS_DIR_NAME, build_flavor, "#{spec.name}.xcframework")
        framework_exists = File.exist?(xcframework_path)

        log_linking_status(spec.name, framework_exists, xcframework_path)

        if framework_exists
          # XCFramework is inside the package, so relative path is simple:
          # .xcframeworks/<buildType>/<PodName>.xcframework
          relative_path = File.join(XCFRAMEWORKS_DIR_NAME, build_flavor, "#{spec.name}.xcframework")
          spec.vendored_frameworks = relative_path
          return true
        end

        false
      end

      # Gets the podspec directory for a spec, trying multiple methods
      def get_podspec_dir(spec)
        # Try to get it from the spec first
        begin
          podspec_file = spec.defined_in_file || spec.send(:podspec_path)
          return File.dirname(podspec_file) if podspec_file
        rescue
          # Ignore errors
        end

        # Fall back to searching for the podspec file
        find_podspec_dir_for(spec.name)
      end

      # Finds the directory containing the podspec for a given pod name.
      # Searches in standard locations within the monorepo structure.
      # This helper is useful for both per-package xcframeworks and future SPM migration.
      def find_podspec_dir_for(pod_name)
        repo_root = find_repo_root
        return nil unless repo_root

        package_name = pod_name_to_package_name(pod_name)

        # Search for the podspec in likely locations
        potential_locations = [
          # Internal packages: packages/<package-name>/
          File.join(repo_root, 'packages', package_name),
          # External packages in packages/external/
          File.join(repo_root, 'packages', 'external', package_name),
          # node_modules (for external packages)
          File.join(repo_root, 'node_modules', package_name),
        ]

        # Find a location that has a matching podspec
        potential_locations.each do |dir|
          podspec_files = Dir.glob(File.join(dir, "#{pod_name}.podspec*"))
          if podspec_files.any? && File.exist?(podspec_files.first)
            return dir
          end
        end

        nil
      end

      # Finds the repository root by walking up from the current directory.
      # Looks for the 'packages' directory as a marker.
      def find_repo_root
        current_dir = Dir.pwd

        loop do
          packages_path = File.join(current_dir, 'packages')
          return current_dir if File.directory?(packages_path)

          parent = File.dirname(current_dir)
          break if parent == current_dir # Reached filesystem root
          current_dir = parent
        end

        nil
      end

      # Returns the codegenConfig library names for pods that should be excluded from codegen.
      #
      # Discovers prebuilt packages from packages/external and reads their spm.config.json
      # to find the codegen module names that should be excluded.
      # Only excludes codegen for packages that have actually been built (XCFramework exists).
      #
      # @param pod_targets [Array<Pod::PodTarget>] The pod targets to check (used to find repo root)
      # @return [Array<String>] codegenConfig.name values to exclude from codegen
      #
      def get_codegen_exclusions(pod_targets)
        return [] unless enabled?

        # Find the monorepo root by looking for packages/external
        repo_root = find_monorepo_root(pod_targets)
        unless repo_root
          Pod::UI.warn "[Expo-precompiled] Could not find monorepo root"
          return []
        end

        external_packages_path = File.join(repo_root, EXTERNAL_PACKAGES_DIR)
        unless File.directory?(external_packages_path)
          Pod::UI.warn "[Expo-precompiled] External packages directory not found: #{external_packages_path}"
          return []
        end

        exclusions = []

        # Iterate through each package in packages/external
        Dir.children(external_packages_path).each do |package_name|
          package_dir = File.join(external_packages_path, package_name)
          next unless File.directory?(package_dir)

          spm_config_path = File.join(package_dir, 'spm.config.json')
          next unless File.exist?(spm_config_path)

          # Check if the XCFramework actually exists before excluding codegen
          # The XCFramework is in node_modules/<package_name>/.xcframeworks/<buildType>/<ProductName>.xcframework
          node_modules_package_dir = File.join(repo_root, 'node_modules', package_name)
          xcframework_exists = check_xcframework_exists_for_package(spm_config_path, node_modules_package_dir)

          unless xcframework_exists
            Pod::UI.info "[Expo-precompiled] Skipping codegen exclusion for '#{package_name}' - XCFramework not built yet"
            next
          end

          # Read the spm.config.json and extract codegen module names
          codegen_names = get_codegen_names_from_spm_config(spm_config_path)
          exclusions.concat(codegen_names)

          Pod::UI.info "[Expo-precompiled] Found external package '#{package_name}' with codegen modules: #{codegen_names.join(', ')}" unless codegen_names.empty?
        end

        exclusions.uniq
      end

      # Checks if the XCFramework exists for a package by reading its spm.config.json
      # and looking for the expected XCFramework file in the package's .xcframeworks directory.
      #
      # @param spm_config_path [String] Path to the spm.config.json file
      # @param package_dir [String] Path to the package in node_modules
      # @return [Boolean] true if at least one product's XCFramework exists
      def check_xcframework_exists_for_package(spm_config_path, package_dir)
        begin
          config = JSON.parse(File.read(spm_config_path))
          products = config['products'] || []

          products.each do |product|
            product_name = product['name']
            next unless product_name

            # XCFramework location: <package>/.xcframeworks/<buildType>/<ProductName>.xcframework
            xcframework_path = File.join(package_dir, XCFRAMEWORKS_DIR_NAME, build_flavor, "#{product_name}.xcframework")
            return true if File.directory?(xcframework_path)
          end
        rescue JSON::ParserError, StandardError => e
          Pod::UI.warn "[Expo-precompiled] Failed to check XCFramework for #{spm_config_path}: #{e.message}"
        end

        false
      end

      # TODO(ExpoModulesJSI-xcframework): Remove this method when ExpoModulesJSI.xcframework
      # is built and distributed separately. At that point, pods can depend on ExpoModulesJSI
      # directly and this header search path workaround won't be needed.
      #
      # Configures header search paths for prebuilt XCFrameworks in the post_install phase.
      #
      # When using prebuilt modules, ExpoModulesJSI headers are bundled inside
      # ExpoModulesCore.xcframework. This method adds the necessary header search paths
      # to all pod targets so that `#import <ExpoModulesJSI/...>` works correctly.
      #
      # @param installer [Pod::Installer] The CocoaPods installer instance
      #
      def configure_header_search_paths(installer)
        return unless enabled?

        # Find ExpoModulesCore.xcframework path
        expo_core_xcframework = find_expo_modules_core_xcframework(installer)
        return unless expo_core_xcframework

        # Collect header search paths from all slices
        header_search_paths = collect_xcframework_header_paths(expo_core_xcframework)
        return if header_search_paths.empty?

        paths_string = header_search_paths.map { |p| "\"#{p}\"" }.join(' ')

        Pod::UI.info "[Expo-precompiled] Adding ExpoModulesJSI header search paths to all targets"

        # Modify xcconfig files directly - these take precedence over Xcode project settings
        pods_root = installer.sandbox.root
        target_support_files_dir = File.join(pods_root, 'Target Support Files')

        # Update ALL xcconfig files in Target Support Files (includes pod targets and aggregate targets)
        Dir.glob(File.join(target_support_files_dir, '**', '*.xcconfig')).each do |xcconfig_path|
          update_xcconfig_header_search_paths(xcconfig_path, paths_string)
        end

        # Also update the main project targets' build settings directly
        # This ensures the header paths are available when building the main app
        installer.pods_project.targets.each do |target|
          target.build_configurations.each do |config|
            existing = config.build_settings['HEADER_SEARCH_PATHS'] || '$(inherited)'
            unless existing.include?(paths_string)
              config.build_settings['HEADER_SEARCH_PATHS'] = "#{existing} #{paths_string}"
            end
          end
        end
      end

      # Configures the ReactCodegen target to properly handle prebuilt modules.
      # This removes source file references for prebuilt libraries from the compile sources phase
      # and adds a shell script build phase to clean up regenerated codegen files.
      #
      # When a library is prebuilt as an XCFramework, its codegen output is already included
      # in the framework. We need to:
      # 1. Remove the generated source files from ReactCodegen's compile sources
      # 2. Delete regenerated files after each codegen run to avoid duplicate symbols
      def configure_codegen_for_prebuilt_modules(installer)
        return unless enabled?

        script_phase_name = '[Expo] Remove duplicate codegen output'
        react_codegen_target = installer.pods_project.targets.find { |target| target.name == 'ReactCodegen' }

        unless react_codegen_target
          Pod::UI.puts "[Expo] ".yellow + "ReactCodegen target not found in pods project"
          return
        end

        # Check if the build phase already exists
        already_exists = react_codegen_target.build_phases.any? do |phase|
          phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase) && phase.name == script_phase_name
        end

        # Get codegen library names for prebuilt packages that should be excluded
        codegen_exclusions = get_codegen_exclusions(installer.pod_targets)

        if codegen_exclusions.any?
          Pod::UI.puts "[Expo] ".blue + "Will remove codegen output for prebuilt libraries: #{codegen_exclusions.join(', ')}"
          remove_codegen_sources_from_compile_phase(react_codegen_target, codegen_exclusions)
        end

        unless already_exists
          Pod::UI.puts "[Expo] ".blue + "Adding '#{script_phase_name}' build phase to ReactCodegen"
          add_codegen_cleanup_script_phase(react_codegen_target, script_phase_name, codegen_exclusions)
          installer.pods_project.save
        end
      end

      private

      # Removes source file references for prebuilt libraries from ReactCodegen compile sources.
      # This prevents Xcode from trying to compile codegen files that are already in the XCFrameworks.
      def remove_codegen_sources_from_compile_phase(target, codegen_exclusions)
        compile_sources_phase = target.build_phases.find do |p|
          p.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase)
        end

        return unless compile_sources_phase

        files_to_remove = []
        compile_sources_phase.files.each do |build_file|
          file_ref = build_file.file_ref
          next unless file_ref

          file_path = file_ref.path.to_s
          display_name = build_file.display_name.to_s

          codegen_exclusions.each do |lib|
            # Match files like:
            # - rnscreens-generated.mm (file name starts with lib name)
            # - rnscreensJSI-generated.cpp
            # - ShadowNodes.cpp in rnscreens/ group
            # - ComponentDescriptors.cpp in rnscreens/ group
            if file_path.start_with?("#{lib}-") ||
               file_path.start_with?("#{lib}JSI") ||
               display_name.start_with?("#{lib}-") ||
               display_name.start_with?("#{lib}JSI") ||
               file_path.include?("/#{lib}/") ||
               file_path.start_with?("#{lib}/")
              files_to_remove << build_file
              break
            end

            # Also check if the file is in a group named after the library
            if file_ref.respond_to?(:parent) && file_ref.parent
              parent_name = file_ref.parent.name.to_s rescue ""
              if parent_name == lib
                files_to_remove << build_file
                break
              end
            end
          end
        end

        if files_to_remove.any?
          Pod::UI.puts "[Expo] ".blue + "Removing #{files_to_remove.count} codegen source files from ReactCodegen compile sources"
          files_to_remove.each do |build_file|
            compile_sources_phase.files.delete(build_file)
          end
        end
      end

      # Adds a shell script build phase to clean up codegen output for prebuilt libraries.
      # React Native's generate-codegen-artifacts.js doesn't support excluding libraries,
      # so we run codegen normally and then delete the generated files for prebuilt libraries.
      def add_codegen_cleanup_script_phase(target, phase_name, codegen_exclusions)
        codegen_cleanup_list = codegen_exclusions.map { |lib| "\"#{lib}\"" }.join(' ')

        phase = target.new_shell_script_build_phase(phase_name)
        phase.shell_path = '/bin/sh'
        phase.shell_script = codegen_cleanup_shell_script(codegen_cleanup_list)

        # Find the index of the "Compile Sources" phase (PBXSourcesBuildPhase)
        compile_sources_index = target.build_phases.find_index do |p|
          p.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase)
        end

        if compile_sources_index
          # Remove the phase from its current position (it was added at the end)
          target.build_phases.delete(phase)
          # Insert it before the "Compile Sources" phase
          target.build_phases.insert(compile_sources_index, phase)
        else
          Pod::UI.puts "[Expo] ".yellow + "Could not find 'Compile Sources' phase, build phase added at default position"
        end
      end

      # Returns the shell script content for the codegen cleanup build phase.
      def codegen_cleanup_shell_script(codegen_cleanup_list)
        <<~SH
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

          # Cleanup generated codegen files for prebuilt libraries to avoid duplicate symbols
          # When a library is prebuilt as an XCFramework, its codegen output is already included in the framework.
          # We need to remove the generated files so they don't get compiled into the ReactCodegen pod as well.
          # NOTE: The source file references have already been removed from the Xcode project during pod install,
          # but we still need to delete the files because codegen regenerates them on each build.
          PREBUILT_CODEGEN_LIBS=(#{codegen_cleanup_list})

          if [ ${#PREBUILT_CODEGEN_LIBS[@]} -gt 0 ]; then
            echo "[Expo] Cleaning up codegen output for prebuilt libraries: ${PREBUILT_CODEGEN_LIBS[*]}"
            CODEGEN_OUTPUT_DIR="$RCT_SCRIPT_OUTPUT_DIR/build/generated/ios/ReactCodegen"

            for lib in "${PREBUILT_CODEGEN_LIBS[@]}"; do
              # Remove module directory (contains .h and -generated.mm files)
              if [ -d "$CODEGEN_OUTPUT_DIR/$lib" ]; then
                echo "[Expo] Removing module: $CODEGEN_OUTPUT_DIR/$lib"
                rm -rf "$CODEGEN_OUTPUT_DIR/$lib"
              fi

              # Remove JSI header file
              if [ -f "$CODEGEN_OUTPUT_DIR/${lib}JSI.h" ]; then
                echo "[Expo] Removing JSI header: $CODEGEN_OUTPUT_DIR/${lib}JSI.h"
                rm -f "$CODEGEN_OUTPUT_DIR/${lib}JSI.h"
              fi

              # Remove components directory
              if [ -d "$CODEGEN_OUTPUT_DIR/react/renderer/components/$lib" ]; then
                echo "[Expo] Removing components: $CODEGEN_OUTPUT_DIR/react/renderer/components/$lib"
                rm -rf "$CODEGEN_OUTPUT_DIR/react/renderer/components/$lib"
              fi
            done
          fi

          # End of workaround code
        SH
      end

      # TODO(ExpoModulesJSI-xcframework): Remove this method when ExpoModulesJSI.xcframework
      # is built and distributed separately.
      #
      # Updates HEADER_SEARCH_PATHS in an xcconfig file
      def update_xcconfig_header_search_paths(xcconfig_path, paths_string)
        content = File.read(xcconfig_path)

        # Find and update HEADER_SEARCH_PATHS line
        if content.include?('HEADER_SEARCH_PATHS')
          updated_content = content.gsub(/^(HEADER_SEARCH_PATHS\s*=\s*)(.*)$/) do |match|
            # Avoid adding duplicate paths
            if $2.include?(paths_string)
              match
            else
              "#{$1}#{$2} #{paths_string}"
            end
          end
          File.write(xcconfig_path, updated_content) if updated_content != content
        else
          # Add HEADER_SEARCH_PATHS if it doesn't exist
          File.open(xcconfig_path, 'a') do |f|
            f.puts "HEADER_SEARCH_PATHS = $(inherited) #{paths_string}"
          end
        end
      end      # Finds the ExpoModulesCore.xcframework path from the installer
      def find_expo_modules_core_xcframework(installer)
        # Look through pod targets to find ExpoModulesCore's vendored framework
        installer.pod_targets.each do |target|
          next unless target.name == 'ExpoModulesCore'

          vendored = target.root_spec.attributes_hash['vendored_frameworks']
          next unless vendored

          frameworks = vendored.is_a?(Array) ? vendored : [vendored]
          frameworks.each do |framework|
            if framework.to_s.include?('ExpoModulesCore.xcframework')
              # The vendored_frameworks path is relative to the podspec location
              # We can get the podspec dir from the target's pod_dir
              podspec_dir = target.sandbox.pod_dir(target.name)
              framework_path = File.expand_path(framework, podspec_dir)

              Pod::UI.info "[Expo-precompiled] Looking for ExpoModulesCore.xcframework at: #{framework_path}"
              return framework_path if File.directory?(framework_path)
            end
          end
        end

        nil
      end

      # Collects header paths from all slices of an XCFramework
      def collect_xcframework_header_paths(xcframework_path)
        paths = []
        return paths unless File.directory?(xcframework_path)

        Dir.children(xcframework_path).each do |slice|
          slice_path = File.join(xcframework_path, slice)
          next unless File.directory?(slice_path)

          # Look for the framework's Headers directory
          framework_headers = File.join(slice_path, 'ExpoModulesCore.framework', 'Headers')
          paths << framework_headers if File.directory?(framework_headers)
        end

        paths
      end

      # Converts a pod name to a package name (e.g., ExpoModulesCore -> expo-modules-core)
      # This helper is useful for finding package directories and for future SPM migration.
      def pod_name_to_package_name(pod_name)
        # Common pattern: CamelCase to kebab-case with 'Expo' prefix becoming 'expo-'
        # ExpoModulesCore -> expo-modules-core
        # ExpoFont -> expo-font
        # RNSVG -> react-native-svg (special case, handled below)

        # Special cases for external packages
        case pod_name
        when 'RNSVG'
          'react-native-svg'
        when 'RNScreens'
          'react-native-screens'
        when 'RNGestureHandler'
          'react-native-gesture-handler'
        when 'RNReanimated'
          'react-native-reanimated'
        else
          # General case: convert CamelCase to kebab-case
          # ExpoModulesCore -> expo-modules-core
          pod_name
            .gsub(/([A-Z]+)([A-Z][a-z])/, '\1-\2')  # Handle consecutive caps
            .gsub(/([a-z\d])([A-Z])/, '\1-\2')      # Handle normal camelCase
            .downcase
        end
      end

      # Logs the linking status for a pod (only once per pod to avoid duplicate output)
      def log_linking_status(pod_name, found, path)
        # Skip logging if we've already logged this pod
        return if Expo::PrecompiledModules.instance_variable_get(:@logged_pods)[pod_name]
        Expo::PrecompiledModules.instance_variable_get(:@logged_pods)[pod_name] = true

        status = found ? "" : "(⚠️ Build from source: framework not found #{path})"
        Pod::UI.info "#{"[Expo-precompiled] ".blue} 📦 #{pod_name.green} #{status}"
      end

      # Finds the monorepo root by searching for packages/external directory
      def find_monorepo_root(pod_targets)
        # Try to find the repo root from the sandbox
        return nil if pod_targets.empty?

        target = pod_targets.first
        return nil unless target.sandbox

        # Start from the sandbox root (Pods folder) and walk up
        current_dir = target.sandbox.root.dirname # ios folder

        # Walk up directories until we find packages/external or reach filesystem root
        loop do
          external_path = File.join(current_dir, EXTERNAL_PACKAGES_DIR)
          return current_dir.to_s if File.directory?(external_path)

          parent = File.dirname(current_dir)
          break if parent == current_dir # Reached filesystem root
          current_dir = parent
        end

        nil
      end

      # Reads spm.config.json and extracts codegen module names from targets
      def get_codegen_names_from_spm_config(spm_config_path)
        codegen_names = []

        begin
          config = JSON.parse(File.read(spm_config_path))
          products = config['products'] || []

          products.each do |product|
            targets = product['targets'] || []
            targets.each do |target|
              # Look for codegen targets (they have moduleName field and name contains 'codegen')
              module_name = target['moduleName']
              target_name = target['name'] || ''
              if module_name && target_name.downcase.include?('codegen')
                codegen_names << module_name
              end
            end
          end
        rescue JSON::ParserError, StandardError => e
          Pod::UI.warn "[Expo-precompiled] Failed to read spm.config.json at #{spm_config_path}: #{e.message}"
        end

        codegen_names
      end
    end
  end
end
