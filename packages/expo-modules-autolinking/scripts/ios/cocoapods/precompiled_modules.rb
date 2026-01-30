# Handles precompiled XCFramework module integration for Expo.
#
# This module provides functionality to:
# 1. Link pods with prebuilt XCFrameworks instead of building from source
# 2. Configure header search paths for ExpoModulesJSI headers bundled in ExpoModulesCore.xcframework
#
# When EXPO_USE_PRECOMPILED_MODULES=1 is set, packages with matching XCFrameworks
# in the .xcframeworks directory will be linked as vendored frameworks.

module Expo
  module PrecompiledModules
    # The environment variable that enables precompiled modules
    ENV_VAR = 'EXPO_USE_PRECOMPILED_MODULES'.freeze

    # The directory where precompiled XCFrameworks are stored (relative to ios folder)
    XCFRAMEWORKS_DIR = '.xcframeworks'.freeze

    # Environment variable for build flavor override
    BUILD_FLAVOR_ENV_VAR = 'EXPO_PRECOMPILED_FLAVOR'.freeze

    # Cache to track which pods have already been logged (to avoid duplicate output)
    @logged_pods = {}

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
      # Looks for the prebuilt framework in `.xcframeworks/{flavor}/{spec.name}.xcframework`
      # If found, sets up the spec to use the vendored framework instead of building from source.
      #
      # @param spec [Pod::Spec] The podspec to potentially link with a prebuilt framework
      # @return [Boolean] true if a prebuilt framework was linked, false otherwise
      #
      # @example
      #   PrecompiledModules.try_link_with_prebuilt_xcframework(spec)
      #
      def try_link_with_prebuilt_xcframework(spec)
        return false unless enabled?

        xcframework_path = xcframework_path_for(spec.name)
        framework_exists = File.exist?(xcframework_path)

        log_linking_status(spec.name, framework_exists, xcframework_path)

        if framework_exists
          spec.vendored_frameworks = xcframework_path
          return true
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

      private

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
      end

      # Finds the ExpoModulesCore.xcframework path from the installer
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

      # Returns the XCFramework path for a given pod name
      def xcframework_path_for(pod_name)
        "#{XCFRAMEWORKS_DIR}/#{build_flavor}/#{pod_name}.xcframework"
      end

      # Logs the linking status for a pod (only once per pod to avoid duplicate output)
      def log_linking_status(pod_name, found, path)
        # Skip logging if we've already logged this pod
        return if Expo::PrecompiledModules.instance_variable_get(:@logged_pods)[pod_name]
        Expo::PrecompiledModules.instance_variable_get(:@logged_pods)[pod_name] = true

        status = found ? "" : "(❌ Build from source: framework not found #{path})"
        Pod::UI.info "#{"[Expo-precompiled] ".blue} 📦 #{pod_name.green} #{status}"
      end
    end
  end
end
