# Handles precompiled XCFramework module integration for Expo.
#
# This module provides functionality to:
# 1. Link pods with prebuilt XCFrameworks instead of building from source
# 2. Discover which pods are using prebuilt XCFrameworks
# 3. Filter prebuilt libraries from React Native's codegen to avoid duplicate symbols
#
# When EXPO_USE_PRECOMPILED_MODULES=1 is set, packages with matching XCFrameworks
# in the centralized build output will be linked as vendored frameworks.
#
# Build output:     packages/precompile/.build/<pkg>/output/<flavor>/xcframeworks/<Product>.tar.gz
#
# Pod install flow:
#   1. has_prebuilt_xcframework?(pod_name) returns true → autolinking uses :podspec instead of :path
#   2. store_podspec hook auto-patches the spec via patch_spec_for_prebuilt (sandbox.rb)
#      (ExpoModulesCore still uses inline try_link_with_prebuilt_xcframework for ExpoModulesJSI)
#   3. spec.source is set to {:http => "file:///<tarball>"} → CocoaPods extracts into Pods/<PodName>/
#   4. prepare_command copies both flavor tarballs into artifacts/ subdirectory
#   5. Script phases switch debug/release at build time via tarball extraction
#
# Resulting layout in Pods/<PodName>/:
#   <Product>.xcframework/                    (extracted by CocoaPods from source tarball)
#   artifacts/<Product>-debug.tar.gz          (copied by prepare_command)
#   artifacts/<Product>-release.tar.gz        (copied by prepare_command)
#   artifacts/.last_build_configuration       (written by prepare_command / switch script)

require 'fileutils'
require 'uri'

module Expo
  module PrecompiledModules
    # The environment variable that enables precompiled modules
    ENV_VAR = 'EXPO_USE_PRECOMPILED_MODULES'.freeze

    # Environment variable for build flavor override
    BUILD_FLAVOR_ENV_VAR = 'EXPO_PRECOMPILED_FLAVOR'.freeze

    # Subdirectory within each pod dir for tarballs and build state
    ARTIFACTS_DIR_NAME = 'artifacts'.freeze

    # Centralized build output directory under packages/precompile/
    PRECOMPILE_BUILD_DIR = '.build'.freeze

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

      # Clears the CocoaPods external download cache for precompiled pods.
      # Prevents stale cache entries (from previous failed installs) from persisting.
      def clear_cocoapods_cache
        return unless enabled?

        cache_root = File.join(Dir.home, 'Library', 'Caches', 'CocoaPods', 'Pods', 'External')
        return unless File.directory?(cache_root)

        get_pod_lookup_map.each do |pod_name, info|
          next unless has_prebuilt_xcframework?(pod_name)

          cache_dir = File.join(cache_root, pod_name)
          if File.directory?(cache_dir)
            FileUtils.rm_rf(cache_dir)
          end
        end
      end

      # Checks whether a prebuilt XCFramework tarball exists for the given pod.
      # Used by autolinking_manager to decide between :podspec and :path registration.
      #
      # @param pod_name [String] The pod name to check
      # @return [Boolean] true if a prebuilt tarball exists in the build output
      def has_prebuilt_xcframework?(pod_name)
        return false unless enabled?

        !resolve_prebuilt_info(pod_name).nil?
      end

      # Returns the set of all SPM dependency framework names that are bundled inside
      # prebuilt XCFrameworks. These pods should be stubbed (header-only) when they appear
      # as source pods, to avoid duplicate symbols with the xcframework.
      #
      # @return [Set<String>] Framework names bundled across all prebuilt pods
      def get_all_bundled_frameworks
        @all_bundled_frameworks ||= begin
          bundled = Set.new
          get_pod_lookup_map.each do |pod_name, info|
            next unless resolve_prebuilt_info(pod_name)
            (info[:spm_dependency_frameworks] || []).each { |f| bundled.add(f) }
          end
          Pod::UI.puts "#{'[Expo-precompiled] '.blue}Bundled SPM frameworks: #{bundled.to_a.join(', ')}" if bundled.any?
          bundled
        end
      end

      # Checks whether a pod should be stubbed because it is bundled inside a prebuilt
      # xcframework. When stubbed, the pod keeps its headers (so dependents can compile)
      # but has no implementation files (the symbols come from the xcframework).
      #
      # @param name [String] The pod name
      # @return [Boolean] true if this pod is bundled in a prebuilt xcframework
      def is_bundled_dependency?(name)
        return false unless enabled?
        # Match exact name and root pod name (for subspecs like 'SDWebImage/Core')
        root_name = name.split('/').first
        bundled = get_all_bundled_frameworks
        bundled.include?(name) || bundled.include?(root_name)
      end

      # Patches a podspec to be header-only, removing implementation files.
      # The pod's headers remain available so dependent pods can still compile,
      # but no object files are produced — the symbols live in the prebuilt xcframework.
      #
      # @param spec [Pod::Specification] The podspec to stub
      # @return [Pod::Specification] A new header-only specification
      def stub_bundled_pod(spec)
        spec_json = JSON.parse(spec.to_pretty_json)

        Pod::UI.puts "#{'[Expo-precompiled] '.blue}Stubbing '#{spec.name}' — bundled in prebuilt xcframework"

        # Keep only header files in source_files
        if spec_json['source_files']
          spec_json['source_files'] = header_only_pattern(spec_json['source_files'])
        end

        # Clear platform-specific source_files to headers only
        %w[ios osx tvos watchos visionos].each do |platform|
          next unless spec_json[platform].is_a?(Hash) && spec_json[platform]['source_files']
          spec_json[platform]['source_files'] = header_only_pattern(spec_json[platform]['source_files'])
        end

        # Stub subspecs too — they may contain implementation files
        (spec_json['subspecs'] || []).each do |subspec|
          if subspec['source_files']
            subspec['source_files'] = header_only_pattern(subspec['source_files'])
          end
          %w[ios osx tvos watchos visionos].each do |platform|
            next unless subspec[platform].is_a?(Hash) && subspec[platform]['source_files']
            subspec[platform]['source_files'] = header_only_pattern(subspec[platform]['source_files'])
          end
        end

        Pod::Specification.from_json(spec_json.to_json)
      end

      # Returns external (3rd-party) pods that have prebuilt XCFrameworks.
      # These need to be registered with :podspec before RN CLI's use_native_modules!
      # registers them with :path (which would ignore spec.source).
      #
      # For external pods registered with :podspec, CocoaPods downloads source using
      # spec.source BEFORE store_podspec can patch it. So we generate pre-patched
      # podspec JSON files with source already set to the local tarball URL.
      #
      # @param project_directory [Pathname] The project root for computing relative paths
      # @return [Array<Hash>] Array of {:pod_name, :podspec_path} for external prebuilt pods
      def get_external_prebuilt_pods(project_directory)
        return [] unless enabled?

        results = []
        get_pod_lookup_map.each do |pod_name, info|
          next unless info[:type] == :external
          next unless has_prebuilt_xcframework?(pod_name)

          # External podspecs are in node_modules/<npm_package>/
          podspec_file = File.join(info[:podspec_dir], "#{pod_name}.podspec")
          next unless File.exist?(podspec_file)

          # Generate a pre-patched podspec JSON file. CocoaPods downloads source using
          # spec.source before store_podspec runs, so the podspec must already have the
          # tarball URL when CocoaPods first reads it.
          patched_podspec = generate_prepatched_podspec(pod_name, podspec_file, info)
          next unless patched_podspec

          podspec_rel = Pathname.new(patched_podspec).relative_path_from(project_directory).to_s
          results << { pod_name: pod_name, podspec_path: podspec_rel }
        end

        results
      end

      # Generates a pre-patched podspec JSON file for an external pod.
      # Evaluates the original podspec, patches it via patch_spec_for_prebuilt,
      # and writes the result as a .podspec.json file next to the original.
      #
      # @param pod_name [String] The pod name
      # @param podspec_file [String] Path to the original .podspec file
      # @param info [Hash] Package info from spm.config.json lookup
      # @return [String, nil] Path to the generated .podspec.json, or nil on failure
      def generate_prepatched_podspec(pod_name, podspec_file, info)
        begin
          spec = Pod::Specification.from_file(podspec_file)
        rescue => e
          Pod::UI.warn "[Expo-precompiled] Failed to evaluate podspec for #{pod_name}: #{e.message}"
          return nil
        end

        patched_spec = patch_spec_for_prebuilt(spec)
        return nil if patched_spec.equal?(spec) # patch_spec_for_prebuilt returns original on failure

        # Strip dependencies — the xcframework is pre-compiled and all SPM dependencies
        # (e.g., lottie-ios, Skia libs) are bundled in the tarball. Dependencies added by
        # install_modules_dependencies (fast_float, React-Codegen, etc.) are not needed
        # and may not be resolvable when the podspec is first read by CocoaPods.
        spec_json = JSON.parse(patched_spec.to_pretty_json)
        spec_json.delete('dependencies')

        # Write the patched podspec JSON next to the original
        json_path = podspec_file.sub(/\.podspec$/, '.podspec.json')
        File.write(json_path, JSON.pretty_generate(spec_json))

        json_path
      end

      # Links a pod spec with a prebuilt XCFramework.
      #
      # NOTE: This method is only used by ExpoModulesCore.podspec, which needs an inline
      # conditional for its source-only ExpoModulesJSI dependency. All other pods are
      # handled by auto-patching in store_podspec → patch_spec_for_prebuilt.
      #
      # Sets spec.source to the local tarball so CocoaPods extracts it into Pods/<PodName>/.
      # Adds a prepare_command to copy both flavor tarballs into artifacts/.
      # Adds script phases for debug/release switching at build time.
      #
      # Called inline from the podspec (not from pre_install).
      #
      # @param spec [Pod::Spec] The podspec to link with a prebuilt framework
      # @return [Boolean] true if a prebuilt framework was linked, false otherwise
      def try_link_with_prebuilt_xcframework(spec)
        return false unless enabled?

        resolved = resolve_prebuilt_info(spec.name)
        unless resolved
          log_linking_status(spec.name, false, "no prebuilt xcframework available")
          return false
        end

        pod_info, product_name, default_tarball = resolved
        build_output_dir = pod_info[:build_output_dir]

        log_linking_status(spec.name, true, default_tarball)

        # Set source to the local tarball — CocoaPods will extract into Pods/<PodName>/
        # URI::File.build produces file:///path (three slashes) which CocoaPods requires for local files.
        # :flatten => false prevents CocoaPods from unwrapping the single top-level xcframework directory.
        spec.source = { :http => URI::File.build(path: default_tarball).to_s, :flatten => false }
        spec.vendored_frameworks = build_vendored_paths(product_name, pod_info)

        # Strip dependencies on libraries bundled in the xcframework.
        # SPM dependencies (e.g., SDWebImage for ExpoImage) are compiled into the xcframework.
        # If left as pod dependencies, CocoaPods installs them from source too → duplicate symbols.
        strip_bundled_dependencies_from_spec(spec, pod_info)

        # prepare_command: self-healing extraction if CocoaPods cache was stale
        # NOTE: Artifact copying (flavor tarballs) is handled by ensure_artifacts in post_install,
        # because CocoaPods skips prepare_command when pods are "unchanged" via Manifest.lock.
        spec.prepare_command = prepare_command_script(product_name, build_output_dir)

        # Add script phases for debug/release switching and dSYM resolution
        add_script_phases(spec, product_name, pod_info)

        true
      end

      # Checks whether a podspec should be auto-patched for precompiled module support.
      # Returns true if the pod has a prebuilt xcframework AND the spec hasn't already
      # been configured by an inline try_link_with_prebuilt_xcframework call.
      #
      # ExpoModulesCore is excluded — it has a source-only dependency on ExpoModulesJSI
      # that requires special handling via the inline conditional.
      #
      # @param name [String] The pod name
      # @param spec [Pod::Specification] The evaluated podspec
      # @return [Boolean] true if the spec should be auto-patched
      def should_auto_patch_spec?(name, spec)
        return false unless enabled?

        # Skip ExpoModulesCore — it keeps its inline conditional for ExpoModulesJSI
        return false if name == 'ExpoModulesCore'

        # Check if the pod has a prebuilt xcframework
        return false unless has_prebuilt_xcframework?(name)

        # Skip if already configured by inline try_link_with_prebuilt_xcframework
        # (detected by vendored_frameworks containing .xcframework entries)
        vendored = spec.attributes_hash['vendored_frameworks']
        if vendored
          frameworks = vendored.is_a?(Array) ? vendored : [vendored]
          return false if frameworks.any? { |f| f.to_s.include?('.xcframework') }
        end

        true
      end

      # Takes a fully-evaluated podspec (with source-build attributes set),
      # converts it to JSON, patches it for precompiled xcframework usage,
      # and returns a new Pod::Specification.
      #
      # Patches applied:
      # - source → tarball file:// URL
      # - vendored_frameworks → product + SPM dependency xcframeworks
      # - Clears source_files, exclude_files, static_framework, header_dir,
      #   header_mappings_dir, private_header_files, compiler_flags
      # - Clears platform-specific source attributes
      # - Removes subspecs and testspecs
      # - Sets prepare_command and script_phases
      # - Ensures pod_target_xcconfig.DEFINES_MODULE = YES
      #
      # @param spec [Pod::Specification] The podspec to patch
      # @return [Pod::Specification] A new patched specification
      def patch_spec_for_prebuilt(spec)
        resolved = resolve_prebuilt_info(spec.name)
        return spec unless resolved

        pod_info, product_name, default_tarball = resolved
        build_output_dir = pod_info[:build_output_dir]

        log_linking_status(spec.name, true, default_tarball)

        spec_json = JSON.parse(spec.to_pretty_json)

        # Override source to local tarball
        spec_json['source'] = { 'http' => URI::File.build(path: default_tarball).to_s, 'flatten' => false }

        # Set vendored frameworks
        spec_json['vendored_frameworks'] = build_vendored_paths(product_name, pod_info)

        # Clear source-build attributes
        %w[source_files exclude_files static_framework header_dir
           header_mappings_dir private_header_files compiler_flags].each do |attr|
          spec_json.delete(attr)
        end

        # Clear platform-specific source attributes
        %w[ios osx tvos watchos visionos].each do |platform|
          next unless spec_json[platform].is_a?(Hash)
          %w[source_files exclude_files private_header_files
             header_dir header_mappings_dir compiler_flags vendored_frameworks].each do |attr|
            spec_json[platform].delete(attr)
          end
          spec_json.delete(platform) if spec_json[platform].empty?
        end

        # Remove subspecs and testspecs (source file groupings / test files not in tarball)
        spec_json.delete('subspecs')
        spec_json.delete('testspecs')

        # Strip dependencies on libraries bundled in the xcframework.
        # SPM dependencies (e.g., SDWebImage for ExpoImage) are compiled into the xcframework.
        # If left as pod dependencies, CocoaPods installs them from source too → duplicate symbols.
        strip_bundled_dependencies(spec_json, pod_info, spec.name)

        # Set prepare_command (self-healing extraction)
        spec_json['prepare_command'] = prepare_command_script(product_name, build_output_dir)

        # Set script phases (switch + dSYM phases)
        spec_json['script_phases'] = build_script_phases_json(spec.name, product_name, pod_info)

        # Ensure DEFINES_MODULE is set
        spec_json['pod_target_xcconfig'] ||= {}
        spec_json['pod_target_xcconfig']['DEFINES_MODULE'] = 'YES'

        Pod::Specification.from_json(spec_json.to_json)
      end

      # Builds the switch and dSYM script phases as JSON-compatible hashes
      # (string keys, string values for execution_position).
      # Reuses xcframework_switch_script and dsym_resolve_script for script content.
      #
      # @param spec_name [String] The pod name (for phase naming and path resolution)
      # @param product_name [String] The product/module name
      # @param pod_info [Hash] Package info from spm.config.json lookup
      # @return [Array<Hash>] Array of script phase hashes with string keys
      def build_script_phases_json(spec_name, product_name, pod_info)
        project_root = Pod::Config.instance.installation_root
        scripts_dir = __dir__
        switch_script_rel = Pathname.new(File.join(scripts_dir, 'replace-xcframework.js')).relative_path_from(project_root).to_s
        dsym_script_rel = Pathname.new(File.join(scripts_dir, 'resolve-dsym-sourcemaps.js')).relative_path_from(project_root).to_s
        package_root_rel = Pathname.new(pod_info[:package_root]).relative_path_from(project_root).to_s

        pods_parent = "$PODS_ROOT/.."
        switch_script_path = "#{pods_parent}/#{switch_script_rel}"
        dsym_script_path = "#{pods_parent}/#{dsym_script_rel}"
        xcframeworks_dir_var = "$PODS_ROOT/#{spec_name}"
        package_root_var = "#{pods_parent}/#{package_root_rel}"

        dsym_stamp = "$(DERIVED_FILE_DIR)/expo-dsym-resolve-#{product_name}-$(CONFIGURATION).stamp"
        npm_package = pod_info[:npm_package]

        switch_phase = {
          'name' => "[Expo] Switch #{spec_name} XCFramework for build configuration",
          'execution_position' => 'before_compile',
          'input_files' => ["#{pods_parent}/#{switch_script_rel}"],
          'script' => xcframework_switch_script(product_name, xcframeworks_dir_var, switch_script_path),
        }

        if Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.13.0')
          switch_phase['always_out_of_date'] = '1'
        end

        dsym_phase = {
          'name' => "[Expo] Resolve #{spec_name} dSYM source maps",
          'execution_position' => 'before_compile',
          'input_files' => ["#{pods_parent}/#{dsym_script_rel}"],
          'output_files' => [dsym_stamp],
          'script' => dsym_resolve_script(product_name, xcframeworks_dir_var, dsym_script_path, npm_package, package_root_var),
        }

        [switch_phase, dsym_phase]
      end

      # Generates the prepare_command shell script.
      # Extracts the xcframework from the build tarball if CocoaPods' download/cache failed.
      # Artifact copying is handled separately by ensure_artifacts in post_install.
      #
      # @param product_name [String] The product/module name
      # @param build_output_dir [String] Absolute path to the build output directory
      # @return [String] Shell script for prepare_command
      def prepare_command_script(product_name, build_output_dir)
        <<~CMD
          # Self-healing: extract xcframework from tarball if CocoaPods cache was stale/empty
          if [ ! -d "#{product_name}.xcframework" ]; then
            TARBALL="#{build_output_dir}/#{build_flavor}/xcframeworks/#{product_name}.tar.gz"
            if [ -f "$TARBALL" ]; then
              echo "[Expo XCFramework] #{product_name}: Extracting xcframework from build output (cache miss)"
              tar xzf "$TARBALL"
            fi
          fi
        CMD
      end

      # Copies flavor tarballs into Pods/<PodName>/artifacts/ for all precompiled pods.
      # Called from post_install (via cocoapods/installer.rb) which runs reliably on every
      # pod install, unlike prepare_command which CocoaPods skips for "unchanged" pods.
      #
      # @param installer [Pod::Installer] The CocoaPods installer instance
      def ensure_artifacts(installer)
        return unless enabled?

        pods_root = installer.sandbox.root
        pod_map = get_pod_lookup_map

        pod_map.each do |pod_name, info|
          next unless has_prebuilt_xcframework?(pod_name)

          product_name = info[:product_name] || pod_name
          build_output_dir = info[:build_output_dir]
          pod_dir = File.join(pods_root, pod_name)

          next unless File.directory?(pod_dir)

          artifacts_dir = File.join(pod_dir, ARTIFACTS_DIR_NAME)
          FileUtils.mkdir_p(artifacts_dir)

          # Copy both flavor tarballs
          ['debug', 'release'].each do |flavor|
            src = File.join(build_output_dir, flavor, 'xcframeworks', "#{product_name}.tar.gz")
            dst = File.join(artifacts_dir, "#{product_name}-#{flavor}.tar.gz")
            if File.exist?(src) && !File.exist?(dst)
              FileUtils.cp(src, dst)
            end
          end

          # Write initial .last_build_configuration if missing
          last_config_file = File.join(artifacts_dir, '.last_build_configuration')
          unless File.exist?(last_config_file)
            File.write(last_config_file, build_flavor)
          end

          # Self-healing: extract xcframework if missing (CocoaPods cache issue)
          xcframework_dir = File.join(pod_dir, "#{product_name}.xcframework")
          unless File.directory?(xcframework_dir)
            tarball = File.join(build_output_dir, build_flavor, 'xcframeworks', "#{product_name}.tar.gz")
            if File.exist?(tarball)
              Pod::UI.info "#{"[Expo-precompiled] ".blue}Extracting #{product_name}.xcframework (cache miss)"
              system("tar", "xzf", tarball, "-C", pod_dir)
            end
          end
        end

        Pod::UI.info "#{"[Expo-precompiled] ".blue}Ensured artifacts for precompiled pods"
      end

      # Adds script phases to the podspec for xcframework switching and dSYM resolution.
      # Delegates to build_script_phases_json and converts string keys to symbols
      # (CocoaPods inline API uses symbols, JSON serialization uses strings).
      #
      # @param spec [Pod::Spec] The podspec to add script phases to
      # @param product_name [String] The product/module name
      # @param pod_info [Hash] Package info from spm.config.json lookup
      def add_script_phases(spec, product_name, pod_info)
        json_phases = build_script_phases_json(spec.name, product_name, pod_info)
        spec.script_phases = json_phases.map do |phase|
          phase.each_with_object({}) do |(k, v), h|
            h[k.to_sym] = k == 'execution_position' ? v.to_sym : v
          end
        end
      end

      # Returns the shell script for the xcframework switch phase.
      # Reads tarballs from artifacts/ subdirectory, extracts xcframeworks into the pod dir.
      def xcframework_switch_script(product_name, xcframeworks_dir, script_path)
        <<-EOS
# Switch between debug/release XCFramework based on build configuration
# This script is auto-generated by expo-modules-autolinking

CONFIG="release"
if echo "$GCC_PREPROCESSOR_DEFINITIONS" | grep -q "DEBUG=1"; then
  CONFIG="debug"
fi

# Early exit: Skip Node.js invocation if configuration hasn't changed
# This optimization avoids ~100-200ms overhead per module on incremental builds
LAST_CONFIG_FILE="#{xcframeworks_dir}/artifacts/.last_build_configuration"
if [ -f "$LAST_CONFIG_FILE" ] && [ "$(cat "$LAST_CONFIG_FILE")" = "$CONFIG" ]; then
  exit 0
fi

# Configuration changed or first build - invoke Node.js to extract tarball
. "$REACT_NATIVE_PATH/scripts/xcode/with-environment.sh"

"$NODE_BINARY" "#{script_path}" \\
  -c "$CONFIG" \\
  -m "#{product_name}" \\
  -x "#{xcframeworks_dir}"
        EOS
      end

      # Returns the shell script for the dSYM source map resolution phase.
      # Writes UUID plists into dSYMs for source path remapping.
      # lldb discovers dSYMs via Spotlight (mdfind by UUID), so the dSYMs must be
      # in a Spotlight-indexed location (i.e., directory name without dot prefix).
      #
      # @param product_name [String] The product/module name (e.g., "ExpoModulesCore")
      # @param xcframeworks_dir [String] Path to the pod directory (build-time var)
      # @param script_path [String] Path to resolve-dsym-sourcemaps.js (build-time var)
      # @param npm_package [String] NPM package name (e.g., "expo-modules-core")
      # @param package_root [String] Path to the local package root (build-time var)
      def dsym_resolve_script(product_name, xcframeworks_dir, script_path, npm_package, package_root)
        <<-EOS
# Resolve dSYM source path mappings for prebuilt xcframeworks
# This script is auto-generated by expo-modules-autolinking
#
# Writes UUID plists into dSYMs so lldb can remap
# /expo-src/... paths back to local package paths.

STAMP_FILE="$DERIVED_FILE_DIR/expo-dsym-resolve-#{product_name}-$CONFIGURATION.stamp"

# Find dSYMs inside the xcframework (all slices)
XCFW_PATH="#{xcframeworks_dir}/#{product_name}.xcframework"

if [ -d "$XCFW_PATH" ]; then
  FOUND_DSYM=0
  for DSYM_DIR in "$XCFW_PATH"/*/dSYMs; do
    if [ -d "$DSYM_DIR/#{product_name}.framework.dSYM" ]; then
      if [ $FOUND_DSYM -eq 0 ]; then
        . "$REACT_NATIVE_PATH/scripts/xcode/with-environment.sh"
        FOUND_DSYM=1
      fi
      "$NODE_BINARY" "#{script_path}" \\
        -d "$DSYM_DIR" \\
        -m "#{product_name}" \\
        -n "#{npm_package}" \\
        -r "#{package_root}"
    fi
  done
fi

# Touch stamp file for Xcode dependency tracking
mkdir -p "$(dirname "$STAMP_FILE")"
touch "$STAMP_FILE"
        EOS
      end

      # Builds and caches a map from pod names to package information.
      # Scans all spm.config.json files in:
      #   - packages/*/spm.config.json (internal Expo packages)
      #   - packages/external/*/spm.config.json (external packages)
      #
      # @return [Hash] Map of podName -> { type:, npm_package:, podspec_dir:, build_output_dir:, codegen_name: }
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

          # Extract npm_package name.
          # For external scoped packages (e.g., packages/external/@shopify/react-native-skia)
          # we derive it from the path. For internal packages, we read package.json
          # because the directory name may differ from the npm name (e.g., expo-app-integrity
          # dir but @expo/app-integrity npm name).
          package_dir = File.dirname(config_path)
          if type == :external
            external_dir = File.join(repo_root, 'packages', 'external')
            npm_package = package_dir.sub("#{external_dir}/", '')
          else
            package_json_path = File.join(package_dir, 'package.json')
            if File.exist?(package_json_path)
              npm_package = JSON.parse(File.read(package_json_path))['name'] || File.basename(package_dir)
            else
              npm_package = File.basename(package_dir)
            end
          end

          products.each do |product|
            pod_name = product['podName']
            next unless pod_name

            product_name = product['name'] || pod_name  # Product name is used for xcframework naming

            # Resolve the codegen module name used by React Native's codegen.
            # For external packages, spm.config.json's codegenName may differ from the actual
            # codegen output name (e.g., "keyboardcontroller" in spm.config vs "RNKC" from
            # codegenConfig.name in package.json). The codegen output name determines the
            # generated file names (e.g., RNKC-generated.mm, RNKC/ directory).
            codegen_name = product['codegenName']
            if type == :external && codegen_name
              ext_pkg_json = File.join(repo_root, 'node_modules', npm_package, 'package.json')
              if File.exist?(ext_pkg_json)
                begin
                  rn_codegen_name = JSON.parse(File.read(ext_pkg_json)).dig('codegenConfig', 'name')
                  if rn_codegen_name && rn_codegen_name != codegen_name
                    Pod::UI.info "#{'[Expo-precompiled] '.blue}#{pod_name}: using codegenConfig.name '#{rn_codegen_name}' instead of '#{codegen_name}'"
                    codegen_name = rn_codegen_name
                  end
                rescue JSON::ParserError
                  # Fall back to spm.config.json value
                end
              end
            end

            # Centralized build output: packages/precompile/.build/<npm_package>/output/
            build_output_dir = File.join(repo_root, 'packages', 'precompile', PRECOMPILE_BUILD_DIR, npm_package, 'output')

            # Determine podspec directory and package root based on package type and conventions
            if type == :internal
              # Internal packages: podspec in packages/<dir>/ios/ or packages/<dir>/
              # Use the actual directory (npm_package may be scoped, e.g. @expo/app-integrity)
              package_root = package_dir
              ios_podspec = File.join(package_root, 'ios', "#{pod_name}.podspec")
              root_podspec = File.join(package_root, "#{pod_name}.podspec")

              podspec_dir = if File.exist?(ios_podspec)
                File.join(package_root, 'ios')
              elsif File.exist?(root_podspec)
                package_root
              else
                # Fallback to ios/ directory (most common for Expo packages)
                File.join(package_root, 'ios')
              end
            else
              # External packages: podspec in node_modules/<npm_package>/
              package_root = File.join(repo_root, 'node_modules', npm_package)
              podspec_dir = package_root
            end

            # Extract target info for dSYM staging path remapping.
            # Each target has a name (staging dir name) and path (real source location relative to package root).
            targets = (product['targets'] || []).select { |t| t['type'] != 'framework' && !t['path']&.start_with?('.build/') }.map do |t|
              { name: t['name'], path: t['path'] }
            end

            # Extract SPM dependency framework names from spmPackages declarations.
            # These are transitive binary dependencies (e.g., Lottie from lottie-spm)
            # that must be vendored alongside the product xcframework.
            spm_dependency_frameworks = (product['spmPackages'] || []).map { |pkg| pkg['productName'] }.compact

            @pod_lookup_map[pod_name] = {
              type: type,
              npm_package: npm_package,
              package_root: package_root,
              podspec_dir: podspec_dir,
              build_output_dir: build_output_dir,
              codegen_name: codegen_name,
              product_name: product_name,
              targets: targets,
              spm_dependency_frameworks: spm_dependency_frameworks
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
          next unless resolve_prebuilt_info(pod_name)

          exclusions << info[:codegen_name]
          Pod::UI.info "#{('[Expo-precompiled]').blue} Found external package '#{info[:npm_package]}' with codegen module: #{info[:codegen_name]}"
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

        Pod::UI.info "#{('[Expo-precompiled]').blue} Adding ExpoModulesJSI header search paths to all targets"

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

      # Removes implementation files from compile phases of pod targets that are bundled
      # inside prebuilt xcframeworks. This handles CDN pods (like SDWebImage) that don't
      # go through the store_podspec hook.
      #
      # Headers are kept so that other source pods can still compile against them,
      # but the symbols come from the prebuilt xcframework at link time.
      #
      # @param installer [Pod::Installer] The CocoaPods installer instance
      def stub_bundled_pod_targets(installer)
        return unless enabled?

        bundled = get_all_bundled_frameworks
        return if bundled.empty?

        stubbed_lib_names = Set.new

        installer.pods_project.targets.each do |target|
          # Match target name against bundled frameworks (e.g., "SDWebImage", "SDWebImage-Core")
          target_root = target.name.split('-').first.split('/').first
          next unless bundled.include?(target.name) || bundled.include?(target_root)

          compile_phase = target.build_phases.find { |p| p.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase) }
          next unless compile_phase

          files_removed = 0
          compile_phase.files.to_a.each do |build_file|
            file_ref = build_file.file_ref
            next unless file_ref

            path = file_ref.path.to_s
            # Remove implementation files but keep headers
            if path.end_with?('.m', '.mm', '.c', '.cpp', '.swift')
              compile_phase.files.delete(build_file)
              files_removed += 1
            end
          end

          if files_removed > 0
            stubbed_lib_names.add(target.name)
            Pod::UI.puts "#{'[Expo-precompiled] '.blue}Stubbed '#{target.name}': removed #{files_removed} source files from compile phase"
          end
        end

        # Remove linker flags (-l<lib>) for stubbed libraries from all xcconfig files.
        # Without source files, no static library is produced, so the linker flags must go.
        if stubbed_lib_names.any?
          remove_linker_flags_for_stubbed_libs(installer, stubbed_lib_names)
        end

        installer.pods_project.save
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

      # Removes -l<lib> linker flags for stubbed libraries from all xcconfig files.
      # When source files are removed from a pod, no static library (.a) is produced,
      # so the linker flag must be removed or the link will fail with "library not found".
      #
      # @param installer [Pod::Installer] The CocoaPods installer instance
      # @param stubbed_lib_names [Set<String>] Names of stubbed pod targets
      def remove_linker_flags_for_stubbed_libs(installer, stubbed_lib_names)
        # Build regex to match -l flags for stubbed libraries
        # Pod target names may use hyphens but linker flags use the product name
        lib_flags = stubbed_lib_names.map { |name| "-l\"#{name}\"" } +
                    stubbed_lib_names.map { |name| "-l#{name}" }
        return if lib_flags.empty?

        pods_dir = installer.sandbox.root
        xcconfig_dir = File.join(pods_dir, 'Target Support Files')
        return unless File.directory?(xcconfig_dir)

        Dir.glob(File.join(xcconfig_dir, '**', '*.xcconfig')).each do |xcconfig_path|
          content = File.read(xcconfig_path)
          original = content.dup

          lib_flags.each do |flag|
            # Remove the flag (with surrounding spaces handled)
            content = content.gsub(/\s*#{Regexp.escape(flag)}/, '')
          end

          if content != original
            File.write(xcconfig_path, content)
            Pod::UI.puts "#{'[Expo-precompiled] '.blue}Cleaned linker flags from #{File.basename(File.dirname(xcconfig_path))}/#{File.basename(xcconfig_path)}"
          end
        end
      end

      # Converts source_files patterns to header-only patterns.
      # Replaces implementation file extensions with just header extensions.
      #
      # @param patterns [String, Array<String>] Original source_files patterns
      # @return [Array<String>] Patterns matching only header files
      def header_only_pattern(patterns)
        patterns = [patterns] unless patterns.is_a?(Array)
        patterns.map do |p|
          # Replace extension groups like {h,m,mm,swift,cpp,c} with just {h,hpp}
          # Also handle single-extension patterns like *.m → *.h
          p.gsub(/\.\{[^}]+\}/, '.{h,hpp}')
           .gsub(/\*\.(m|mm|swift|c|cpp)$/, '*.{h,hpp}')
        end.uniq
      end

      # Resolves prebuilt xcframework info for a pod.
      # Returns [pod_info, product_name, tarball_path] or nil if not available.
      #
      # @param pod_name [String] The pod name to look up
      # @return [Array, nil] [pod_info, product_name, tarball_path] or nil
      def resolve_prebuilt_info(pod_name)
        pod_info = get_pod_lookup_map[pod_name]
        return nil unless pod_info

        product_name = pod_info[:product_name] || pod_name
        tarball = File.join(pod_info[:build_output_dir], build_flavor, 'xcframeworks', "#{product_name}.tar.gz")
        return nil unless File.exist?(tarball)

        [pod_info, product_name, tarball]
      end

      # Strips dependencies on SPM packages bundled in the xcframework from a spec JSON hash.
      # Used by patch_spec_for_prebuilt (JSON-based patching).
      #
      # @param spec_json [Hash] The podspec as a parsed JSON hash (modified in place)
      # @param pod_info [Hash] Package info from spm.config.json lookup
      # @param pod_name [String] Pod name for logging
      def strip_bundled_dependencies(spec_json, pod_info, pod_name)
        bundled = (pod_info[:spm_dependency_frameworks] || []).to_set
        return if bundled.empty? || !spec_json['dependencies'].is_a?(Hash)

        spec_json['dependencies'].delete_if do |dep_name, _|
          # Match exact names and subspec references (e.g., 'libavif/libdav1d' → 'libavif')
          root_name = dep_name.split('/').first
          if bundled.include?(dep_name) || bundled.include?(root_name)
            Pod::UI.puts "#{'[Expo-precompiled] '.blue}Stripping bundled dependency '#{dep_name}' from #{pod_name}"
            true
          else
            false
          end
        end
        spec_json.delete('dependencies') if spec_json['dependencies'].empty?
      end

      # Strips dependencies on SPM packages bundled in the xcframework from a live spec object.
      # Used by try_link_with_prebuilt_xcframework (DSL-based patching).
      #
      # NOTE: Pod::Specification doesn't expose a public API to remove dependencies,
      # so we modify the attributes_hash directly.
      #
      # @param spec [Pod::Specification] The podspec to modify
      # @param pod_info [Hash] Package info from spm.config.json lookup
      def strip_bundled_dependencies_from_spec(spec, pod_info)
        bundled = (pod_info[:spm_dependency_frameworks] || []).to_set
        return if bundled.empty?

        deps = spec.attributes_hash['dependencies']
        return unless deps.is_a?(Hash)

        deps.delete_if do |dep_name, _|
          root_name = dep_name.split('/').first
          if bundled.include?(dep_name) || bundled.include?(root_name)
            Pod::UI.puts "#{'[Expo-precompiled] '.blue}Stripping bundled dependency '#{dep_name}' from #{spec.name}"
            true
          else
            false
          end
        end
      end

      # Builds the vendored_frameworks paths array for a prebuilt pod.
      # Includes the product xcframework and any SPM dependency xcframeworks.
      #
      # @param product_name [String] The product/module name
      # @param pod_info [Hash] Package info from spm.config.json lookup
      # @return [Array<String>] vendored framework paths
      def build_vendored_paths(product_name, pod_info)
        paths = ["#{product_name}.xcframework"]
        (pod_info[:spm_dependency_frameworks] || []).each do |dep_name|
          paths << "#{dep_name}.xcframework"
          Pod::UI.info "#{"[Expo-precompiled] ".blue}     📦 #{dep_name}.xcframework".green
        end
        paths
      end

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

              Pod::UI.info "#{('[Expo-precompiled]').blue} Looking for ExpoModulesCore.xcframework at: #{framework_path}"
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
