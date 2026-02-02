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

require 'fileutils'

module Expo
  module PrecompiledModules
    # The environment variable that enables precompiled modules
    ENV_VAR = 'EXPO_USE_PRECOMPILED_MODULES'.freeze

    # Environment variable for build flavor override
    BUILD_FLAVOR_ENV_VAR = 'EXPO_PRECOMPILED_FLAVOR'.freeze

    # The xcframeworks directory name inside each package
    # Structure: <package>/.xcframeworks/<buildType>/<PodName>.xcframework
    XCFRAMEWORKS_DIR_NAME = '.xcframeworks'.freeze

    # Module-level caches (initialized lazily)
    @pod_lookup_map = nil
    @repo_root = nil
    @logged_pods = nil

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

        # Look up the package info from spm.config.json
        pod_info = get_pod_lookup_map[spec.name]
        unless pod_info
          log_linking_status(spec.name, false, "not found in spm.config.json")
          return false
        end

        # XCFramework location: <xcframework_dir>/.xcframeworks/<buildType>/<ProductName>.xcframework
        # The xcframework is named after the SPM product name, not the pod name
        product_name = pod_info[:product_name] || spec.name
        xcframeworks_dir = File.join(pod_info[:xcframework_dir], XCFRAMEWORKS_DIR_NAME)

        # Check if the xcframework exists in the default build flavor directory
        xcframework_path = File.join(xcframeworks_dir, build_flavor, "#{product_name}.xcframework")
        framework_exists = File.exist?(xcframework_path)

        log_linking_status(spec.name, framework_exists, xcframework_path)

        if framework_exists
          # Create current/ symlink at pod install time - this ensures CocoaPods can set up module maps
          # The script_phase will update this symlink at build time based on the actual build configuration
          current_dir = File.join(xcframeworks_dir, 'current')
          current_xcframework_path = File.join(current_dir, "#{product_name}.xcframework")

          # Create current/ directory if needed
          FileUtils.mkdir_p(current_dir) unless File.exist?(current_dir)

          # Only create/update symlink if it doesn't exist or points to a different target.
          # Preserving the symlink's timestamp prevents unnecessary XCFramework copies on incremental builds,
          # since Xcode uses file timestamps to determine if inputs have changed.
          expected_target = File.join('..', build_flavor, "#{product_name}.xcframework")

          if File.symlink?(current_xcframework_path)
            current_target = File.readlink(current_xcframework_path)
            if current_target != expected_target
              # Symlink points to wrong target (e.g., debug vs release changed), update it
              File.unlink(current_xcframework_path)
              File.symlink(expected_target, current_xcframework_path)
            end
            # Otherwise, symlink already points to the correct target - don't touch it
          elsif File.exist?(current_xcframework_path)
            # If it's a real file/directory (not a symlink), leave it alone
            # This shouldn't happen but be safe
          else
            # Symlink doesn't exist, create it
            File.symlink(expected_target, current_xcframework_path)
          end

          relative_path = Pathname.new(current_xcframework_path).relative_path_from(Pathname.new(pod_info[:podspec_dir])).to_s
          spec.vendored_frameworks = relative_path

          # Add script_phase to switch between debug/release at build time
          # This runs before each compile and updates the current/ symlink based on GCC_PREPROCESSOR_DEFINITIONS
          add_xcframework_switch_script_phase(spec, product_name, xcframeworks_dir)

          return true
        end

        false
      end

      # Adds a script_phase to the podspec that switches between debug/release XCFrameworks
      # at build time based on Xcode's GCC_PREPROCESSOR_DEFINITIONS.
      #
      # @param spec [Pod::Spec] The podspec to add the script phase to
      # @param product_name [String] The product/module name (e.g., "ExpoModulesCore")
      # @param xcframeworks_dir [String] Absolute path to the .xcframeworks directory
      def add_xcframework_switch_script_phase(spec, product_name, xcframeworks_dir)
        # Get the absolute path to the script - __dir__ gives us the directory of this Ruby file
        # which is expo-modules-autolinking/scripts/ios/
        script_path = File.join(__dir__, 'replace-expo-xcframework.js')

        # Define paths for Xcode dependency tracking
        # The stamp file includes $(CONFIGURATION) so that switching Debug<->Release
        # invalidates the output and forces the script to re-run
        stamp_file = "$(DERIVED_FILE_DIR)/expo-xcframework-switch-#{product_name}-$(CONFIGURATION).stamp"

        script_phase = {
          :name => "[Expo] Switch #{spec.name} XCFramework for build configuration",
          :execution_position => :before_compile,
          # Input: The switch script itself. Changes to expo-modules-autolinking will re-run.
          # We don't use .last_build_configuration because it doesn't exist on first build.
          :input_files => [script_path],
          # Output: A stamp file that includes $(CONFIGURATION) in its name.
          # This means switching Debug<->Release changes the expected output path,
          # which invalidates the cache and forces the script to run.
          :output_files => [stamp_file],
          :script => <<-EOS
# Switch between debug/release XCFramework based on build configuration
# This script is auto-generated by expo-modules-autolinking

CONFIG="release"
if echo "$GCC_PREPROCESSOR_DEFINITIONS" | grep -q "DEBUG=1"; then
  CONFIG="debug"
fi

# Stamp file for Xcode dependency tracking - includes CONFIGURATION in path
# so switching Debug<->Release invalidates the output
STAMP_FILE="$DERIVED_FILE_DIR/expo-xcframework-switch-#{product_name}-$CONFIGURATION.stamp"

# Early exit: Skip Node.js invocation if configuration hasn't changed
# This optimization avoids ~100-200ms overhead per module on incremental builds
LAST_CONFIG_FILE="#{xcframeworks_dir}/.last_build_configuration"
if [ -f "$LAST_CONFIG_FILE" ] && [ "$(cat "$LAST_CONFIG_FILE")" = "$CONFIG" ]; then
  # Touch the stamp file to satisfy Xcode's output file requirement
  mkdir -p "$(dirname "$STAMP_FILE")"
  touch "$STAMP_FILE"
  exit 0
fi

# Configuration changed or first build - invoke Node.js to update symlinks
. "$REACT_NATIVE_PATH/scripts/xcode/with-environment.sh"

"$NODE_BINARY" "#{script_path}" \\
  -c "$CONFIG" \\
  -m "#{product_name}" \\
  -x "#{xcframeworks_dir}"

# Touch the stamp file to satisfy Xcode's output file requirement
mkdir -p "$(dirname "$STAMP_FILE")"
touch "$STAMP_FILE"
          EOS
        }

        spec.script_phase = script_phase
      end

      # Builds and caches a map from pod names to package information.
      # Scans all spm.config.json files in:
      #   - packages/*/spm.config.json (internal Expo packages)
      #   - packages/external/*/spm.config.json (external packages)
      #
      # @return [Hash] Map of podName -> { type:, npm_package:, podspec_dir:, xcframework_dir:, codegen_name: }
      def get_pod_lookup_map
        return @pod_lookup_map if @pod_lookup_map

        @pod_lookup_map = {}
        repo_root = find_repo_root
        return @pod_lookup_map unless repo_root

        # Scan internal packages: packages/*/spm.config.json
        Dir.glob(File.join(repo_root, 'packages', '*', 'spm.config.json')).each do |config_path|
          next if config_path.include?('/external/')
          process_spm_config(config_path, :internal, repo_root)
        end

        # Scan external packages: packages/external/*/spm.config.json (non-scoped)
        Dir.glob(File.join(repo_root, 'packages', 'external', '*', 'spm.config.json')).each do |config_path|
          next if config_path.include?('/@') # Skip scoped packages in this pass
          process_spm_config(config_path, :external, repo_root)
        end

        # Scan external packages: packages/external/@scope/*/spm.config.json (scoped)
        Dir.glob(File.join(repo_root, 'packages', 'external', '@*', '*', 'spm.config.json')).each do |config_path|
          process_spm_config(config_path, :external, repo_root)
        end

        @pod_lookup_map
      end

      # Processes a single spm.config.json file and adds entries to the map.
      def process_spm_config(config_path, type, repo_root)
        begin
          config = JSON.parse(File.read(config_path))
          products = config['products'] || []

          # Extract npm_package name from path
          # For scoped packages like packages/external/@shopify/react-native-skia/spm.config.json
          # we need @shopify/react-native-skia, not just react-native-skia
          package_dir = File.dirname(config_path)
          if type == :external
            external_dir = File.join(repo_root, 'packages', 'external')
            npm_package = package_dir.sub("#{external_dir}/", '')
          else
            npm_package = File.basename(package_dir)
          end

          products.each do |product|
            pod_name = product['podName']
            next unless pod_name

            codegen_name = product['codegenName']
            product_name = product['name'] || pod_name  # Product name is used for xcframework naming

            # Determine podspec directory based on package type and conventions
            if type == :internal
              # Internal packages: podspec in packages/<npm_package>/ios/ or packages/<npm_package>/
              package_dir = File.join(repo_root, 'packages', npm_package)
              ios_podspec = File.join(package_dir, 'ios', "#{pod_name}.podspec")
              root_podspec = File.join(package_dir, "#{pod_name}.podspec")

              podspec_dir = if File.exist?(ios_podspec)
                File.join(package_dir, 'ios')
              elsif File.exist?(root_podspec)
                package_dir
              else
                # Fallback to ios/ directory (most common for Expo packages)
                File.join(package_dir, 'ios')
              end

              # XCFrameworks are in the same directory as the podspec
              xcframework_dir = podspec_dir
            else
              # External packages: podspec in node_modules/<npm_package>/
              podspec_dir = File.join(repo_root, 'node_modules', npm_package)
              xcframework_dir = podspec_dir
            end

            @pod_lookup_map[pod_name] = {
              type: type,
              npm_package: npm_package,
              podspec_dir: podspec_dir,
              xcframework_dir: xcframework_dir,
              codegen_name: codegen_name,
              product_name: product_name
            }
          end
        rescue JSON::ParserError, StandardError => e
          Pod::UI.warn "[Expo-precompiled] Failed to read spm.config.json at #{config_path}: #{e.message}"
        end
      end

      # Finds the repository root by walking up from the current directory.
      # Looks for the 'packages' directory as a marker.
      #
      # @param start_dir [String] Directory to start searching from (defaults to Dir.pwd)
      # @return [String, nil] The repository root path, or nil if not found
      def find_repo_root(start_dir = nil)
        current_dir = start_dir || Dir.pwd

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

        exclusions = []
        pod_map = get_pod_lookup_map

        # Find external packages with codegen that have XCFrameworks built
        pod_map.each do |pod_name, info|
          next unless info[:type] == :external
          next unless info[:codegen_name]

          # Check if the XCFramework actually exists before excluding codegen
          # Use product_name for xcframework path (xcframework is named after product, not pod)
          product_name = info[:product_name] || pod_name
          xcframework_path = File.join(info[:xcframework_dir], XCFRAMEWORKS_DIR_NAME, build_flavor, "#{product_name}.xcframework")
          next unless File.directory?(xcframework_path)

          exclusions << info[:codegen_name]
          Pod::UI.info "[Expo-precompiled] Found external package '#{info[:npm_package]}' with codegen module: #{info[:codegen_name]}"
        end

        exclusions.uniq
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

        # Add input/output files to enable Xcode dependency analysis.
        # This allows Xcode to skip this script phase when inputs haven't changed.
        # Input: autolinking.json - changes when codegen-enabled libraries change
        # Output: A marker file that gets touched when codegen runs
        phase.input_paths = ['$(PODS_ROOT)/../build/generated/autolinking/autolinking.json']
        phase.output_paths = ['$(DERIVED_FILE_DIR)/expo-codegen-cleanup.stamp']

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
      # This script runs AFTER the main codegen workaround (added by installer.rb) and
      # removes generated files for prebuilt libraries to avoid duplicate symbols.
      def codegen_cleanup_shell_script(codegen_cleanup_list)
        <<~SH
          # Cleanup generated codegen files for prebuilt libraries to avoid duplicate symbols
          # When a library is prebuilt as an XCFramework, its codegen output is already included in the framework.
          # We need to remove the generated files so they don't get compiled into the ReactCodegen pod as well.
          # NOTE: The source file references have already been removed from the Xcode project during pod install,
          # but we still need to delete the files because codegen regenerates them on each build.

          PREBUILT_CODEGEN_LIBS=(#{codegen_cleanup_list})
          CODEGEN_OUTPUT_DIR="$PODS_ROOT/../build/generated/ios/ReactCodegen"

          if [ ${#PREBUILT_CODEGEN_LIBS[@]} -gt 0 ]; then
            echo "[Expo] Cleaning up codegen output for prebuilt libraries: ${PREBUILT_CODEGEN_LIBS[*]}"

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

          # Touch the stamp file for Xcode dependency tracking
          mkdir -p "$DERIVED_FILE_DIR"
          touch "$DERIVED_FILE_DIR/expo-codegen-cleanup.stamp"
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

      # Logs the linking status for a pod (only once per pod to avoid duplicate output)
      def log_linking_status(pod_name, found, path)
        # Skip logging if we've already logged this pod
        @logged_pods ||= {}
        return if @logged_pods[pod_name]
        @logged_pods[pod_name] = true

        status = found ? "" : "(⚠️ Build from source: framework not found #{path})"
        Pod::UI.info "#{"[Expo-precompiled] ".blue} 📦 #{pod_name.green} #{status}"
      end
    end
  end
end
