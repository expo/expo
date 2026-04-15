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
# Custom path:      Set EXPO_PRECOMPILED_MODULES_PATH to override the base directory
#                   (replaces packages/precompile/.build/), keeping <pkg>/output/... structure
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
require 'json'
require 'uri'

module Expo
  module PrecompiledModules
    # The environment variable that enables precompiled modules
    ENV_VAR = 'EXPO_USE_PRECOMPILED_MODULES'.freeze

    # Environment variable for build flavor override
    BUILD_FLAVOR_ENV_VAR = 'EXPO_PRECOMPILED_FLAVOR'.freeze

    # Environment variable for custom precompiled modules base path
    MODULES_PATH_ENV_VAR = 'EXPO_PRECOMPILED_MODULES_PATH'.freeze

    # Subdirectory within each pod dir for tarballs and build state
    ARTIFACTS_DIR_NAME = 'artifacts'.freeze

    # Centralized build output directory under packages/precompile/
    PRECOMPILE_BUILD_DIR = '.build'.freeze

    # Apple platforms supported by CocoaPods podspecs
    APPLE_PLATFORMS = %w[ios osx tvos watchos visionos].freeze

    # Implementation source file extensions (everything except headers)
    SOURCE_FILE_EXTENSIONS = %w[.m .mm .c .cpp .swift].freeze

    # Regex to strip `framework module React { ... }` from modulemaps
    FRAMEWORK_MODULE_REACT_REGEX = /framework module React \{.*?\n\}\s*/m

    # Module-level caches (initialized lazily)
    @pod_lookup_map = nil
    @repo_root = nil
    @linked_pods = nil
    @build_from_source_patterns = []
    @react_native_version = nil
    @hermes_version = nil
    @claimed_vendored_frameworks = nil  # Set<String> — xcframework names already claimed by a prebuilt pod
    @framework_owner_map = nil          # Hash: framework_name -> owning_pod_name

    class << self
      # Returns the build flavor (debug/release) for precompiled modules.
      # Defaults to 'debug', can be overridden via EXPO_PRECOMPILED_FLAVOR env var.
      def build_flavor
        ENV[BUILD_FLAVOR_ENV_VAR] || 'debug'
      end

      # Returns custom base path for precompiled module output, if set.
      # When set, replaces the default `packages/precompile/.build/` base directory.
      # The directory structure under this path must match:
      #   <npm_package>/output/<flavor>/xcframeworks/<Product>.tar.gz
      def custom_modules_path
        ENV[MODULES_PATH_ENV_VAR]
      end

      # Returns true if precompiled modules are enabled via environment variable
      def enabled?
        ENV[ENV_VAR] == '1'
      end

      # Sets the list of package name patterns that should be built from source
      # instead of using precompiled xcframeworks. Patterns are treated as regexes
      # (e.g., ".*" for all, "expo-audio" for exact match, "expo-.*" for prefix).
      def build_from_source=(patterns)
        @build_from_source_patterns = (patterns || []).map { |p| Regexp.new("^#{p}$") }
      end

      # Checks if a pod is configured to be built from source via buildFromSource.
      # Matches against both the pod name and the npm package name.
      def build_from_source?(pod_name)
        return false unless @build_from_source_patterns&.any?

        npm_package = pod_lookup_map[pod_name]&.dig(:npm_package)
        @build_from_source_patterns.any? { |re|
          re.match?(pod_name) || (npm_package && re.match?(npm_package))
        }
      end

      # ──────────────────────────────────────────────────────────────────────
      # Facade methods — called from installer.rb / autolinking_manager.rb
      # ──────────────────────────────────────────────────────────────────────

      # Runs all precompiled module post-install steps.
      # Called from installer.rb after CocoaPods' own post-install actions.
      #
      # @param installer [Pod::Installer] The CocoaPods installer instance
      def perform_post_install(installer)
        print_linking_summary
        disable_swift_interface_verification(installer)
        configure_use_frameworks(installer)
        ensure_artifacts(installer)
        configure_header_search_paths(installer)
        configure_codegen_for_prebuilt_modules(installer)
        stub_bundled_pod_targets(installer)
      end

      # Runs all precompiled module pre-install steps.
      # Disables use_frameworks! for pods that can't be built as frameworks:
      # - Hardcoded list of pods with React headers in their public API
      # - Pods that vendor xcframeworks (already precompiled)
      # - Source-built pods that depend on React-Core (non-modular includes)
      #
      # @param installer [Pod::Installer] The CocoaPods installer instance
      def perform_pre_install(installer)
        return unless enabled?
        return unless prebuilt_react_active?
        return if linkage(installer).nil?

        pods_to_downgrade = Set.new(installer.podfile.framework_modules_to_patch)

        installer.pod_targets.each do |t|
          if has_vendored_xcframeworks?(t)
            pods_to_downgrade.add(t.name)
          elsif t.root_spec.dependencies.any? { |d| d.name.start_with?('React-Core') }
            pods_to_downgrade.add(t.name)
          end
        end

        Pod::UI.puts "[Expo] ".blue + "Disabling USE_FRAMEWORKS for #{pods_to_downgrade.size} pods (#{pods_to_downgrade.to_a.join(', ')})"

        installer.pod_targets.each do |t|
          if pods_to_downgrade.include?(t.name)
            def t.build_type
              Pod::BuildType.static_library
            end
          end
        end
      end

      # ──────────────────────────────────────────────────────────────────────
      # Cache management
      # ──────────────────────────────────────────────────────────────────────

      # Clears CocoaPods caches for precompiled pods to ensure specs are re-fetched
      # and patched on every `pod install`. Without this, incremental installs reuse
      # stale unpatched specs from `Pods/Local Podspecs/` and the external download
      # cache, causing precompiled pods to fall back to source builds.
      def clear_cocoapods_cache
        return unless enabled?

        cache_root = File.join(Dir.home, 'Library', 'Caches', 'CocoaPods', 'Pods', 'External')
        pods_root = Pod::Config.instance.sandbox_root rescue nil
        local_podspecs_dir = pods_root ? File.join(pods_root, 'Local Podspecs') : nil

        pod_lookup_map.each_key do |pod_name|
          next unless has_prebuilt_xcframework?(pod_name)

          # Clear the external download cache
          if cache_root && File.directory?(cache_root)
            cache_dir = File.join(cache_root, pod_name)
            FileUtils.rm_rf(cache_dir) if File.directory?(cache_dir)
          end

          # Clear cached podspecs so store_podspec is called again on the next install,
          # allowing the spec to be patched for precompiled xcframework usage.
          if local_podspecs_dir && File.directory?(local_podspecs_dir)
            cached_spec = File.join(local_podspecs_dir, "#{pod_name}.podspec.json")
            FileUtils.rm_f(cached_spec) if File.exist?(cached_spec)
          end

          # Clear the pod's installed directory so CocoaPods re-downloads from the
          # patched spec's source tarball instead of reusing stale source-build artifacts.
          if pods_root
            pod_dir = File.join(pods_root, pod_name)
            if File.directory?(pod_dir)
              product_name = pod_lookup_map[pod_name]&.dig(:product_name) || pod_name
              xcfw_info = File.join(pod_dir, "#{product_name}.xcframework", 'Info.plist')
              unless File.exist?(xcfw_info)
                FileUtils.rm_rf(pod_dir)
              end
            end
          end
        end
      end

      # ──────────────────────────────────────────────────────────────────────
      # Query methods
      # ──────────────────────────────────────────────────────────────────────

      # Checks whether a prebuilt XCFramework tarball exists for the given pod.
      # Used by autolinking_manager to decide between :podspec and :path registration.
      #
      # @param pod_name [String] The pod name to check
      # @return [Boolean] true if a prebuilt tarball exists in the build output
      def has_prebuilt_xcframework?(pod_name)
        return false unless enabled?

        !resolve_prebuilt_info(pod_name).nil?
      end

      # Returns whether test specs should be included for a pod.
      # Prebuilt pods don't contain test files, so test specs must be skipped.
      #
      # @param pod_name [String] The pod name to check
      # @return [Boolean] true if test specs should be included
      def should_include_test_specs?(pod_name)
        !has_prebuilt_xcframework?(pod_name)
      end

      # Checks whether a pod should be stubbed because it is bundled inside a prebuilt
      # xcframework. When stubbed, the pod keeps its headers (so dependents can compile)
      # but has no implementation files (the symbols come from the xcframework).
      #
      # @param name [String] The pod name
      # @return [Boolean] true if this pod is bundled in a prebuilt xcframework
      def bundled_dependency?(name)
        return false unless enabled?
        root_name = name.split('/').first
        bundled = all_bundled_frameworks
        bundled.include?(name) || bundled.include?(root_name)
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
        return false if name == 'ExpoModulesCore'
        return false unless has_prebuilt_xcframework?(name)

        vendored = spec.attributes_hash['vendored_frameworks']
        if vendored
          frameworks = vendored.is_a?(Array) ? vendored : [vendored]
          return false if frameworks.any? { |f| f.to_s.include?('.xcframework') }
        end

        true
      end

      # Returns true if the pod target vendors .xcframework files.
      # These pods are already precompiled — CocoaPods doesn't need to wrap them in a framework.
      def has_vendored_xcframeworks?(pod_target)
        vendored = pod_target.root_spec.attributes_hash['vendored_frameworks']
        return false unless vendored
        frameworks = vendored.is_a?(Array) ? vendored : [vendored]
        frameworks.any? { |f| f.to_s.include?('.xcframework') }
      end

      # Returns the linkage type if use_frameworks! is active, otherwise returns nil.
      # Checks both the USE_FRAMEWORKS env var and podfile properties (ios.useFrameworks).
      #
      # @param installer [Pod::Installer] The CocoaPods installer instance
      # @return [Symbol, nil] :dynamic, :static, or nil
      def linkage(installer)
        value = ENV["USE_FRAMEWORKS"]
        if value.nil?
          podfile_dir = File.dirname(installer.podfile.defined_in_file)
          props_path = File.join(podfile_dir, 'Podfile.properties.json')
          if File.exist?(props_path)
            value = JSON.parse(File.read(props_path))['ios.useFrameworks']
          end
        end
        return nil if value.nil?
        return :dynamic if value.downcase == 'dynamic'
        return :static if value.downcase == 'static'
        nil
      end

      # ──────────────────────────────────────────────────────────────────────
      # Pod registration (called from autolinking_manager.rb)
      # ──────────────────────────────────────────────────────────────────────

      # Returns the pod registration options hash for a given pod.
      # When a prebuilt xcframework exists, returns :podspec options so CocoaPods
      # respects spec.source and extracts the tarball. Otherwise returns :path options.
      #
      # @param pod [Expo::PackagePod] The pod to register
      # @param project_directory [Pathname] The project root for computing relative paths
      # @param debug_configurations [Array<String>] Debug configuration names
      # @param package [Expo::Package] The package containing the pod
      # @param global_flags [Hash] Global flags to merge into pod options
      # @return [Hash] Pod options hash suitable for passing to podfile.pod
      def pod_registration_options(pod, project_directory, debug_configurations, package, global_flags)
        configuration = package.debugOnly ? debug_configurations : []

        if has_prebuilt_xcframework?(pod.pod_name)
          podspec_file_path = Pathname.new(pod.podspec_dir)
            .relative_path_from(project_directory)
            .join("#{pod.pod_name}.podspec").to_path
          { :podspec => podspec_file_path, :configuration => configuration }.merge(global_flags, package.flags)
        else
          podspec_dir_path = Pathname.new(pod.podspec_dir).relative_path_from(project_directory).to_path
          { :path => podspec_dir_path, :configuration => configuration }.merge(global_flags, package.flags)
        end
      end

      # Registers external (3rd-party) prebuilt pods with :podspec BEFORE RN CLI's
      # use_native_modules! runs. RN CLI always uses :path which makes CocoaPods ignore
      # spec.source. By registering here first, RN CLI will skip these pods (it checks
      # for existing dependencies), and CocoaPods will respect the spec.source tarball URL.
      #
      # @param podfile [Pod::Podfile] The podfile to register pods in
      # @param target_definition [Pod::Podfile::TargetDefinition] The current target definition
      # @param project_directory [Pathname] The project root for computing relative paths
      def register_external_pods(podfile, target_definition, project_directory)
        external_prebuilt_pods(project_directory).each do |ext_pod|
          next if target_definition.dependencies.any? { |dep| dep.name == ext_pod[:pod_name] }

          Pod::UI.message "— #{ext_pod[:pod_name].green} (prebuilt xcframework)"
          podfile.pod(ext_pod[:pod_name], :podspec => ext_pod[:podspec_path])
        end
      end

      # Registers companion pods gated by a Podfile property.
      # A product can declare `autolinkWhen` in its spm.config.json to opt into this flow.
      # The pod is auto-registered when:
      #   1. The podspec exists (source build) or prebuilt xcframework exists (precompiled)
      #   2. The gating Podfile.properties.json value is not the disabled value
      #   3. It's not already registered in the Podfile
      #   4. All of its local dependencies (pods in the lookup map) are already registered
      #
      # Works for both precompiled and source builds. For precompiled builds, the
      # podspec is patched to use the xcframework. For source builds, CocoaPods
      # builds from source via :podspec.
      #
      # Companion pods are production-only code (they never declare test specs) and
      # typically depend on their sibling main pod. When the Podfile calls
      # `use_expo_modules_tests!` (tests_only), main pods without test specs are skipped,
      # so registering a companion that depends on a skipped main pod would fail
      # dependency resolution. Skip companions entirely in tests-only mode.
      #
      # Example spm.config.json:
      #   "autolinkWhen": {
      #     "podfileProperty": "expo.camera.barcode-scanner-enabled",
      #     "disabledValue": "false"
      #   }
      def register_companion_pods(podfile, target_definition, project_directory, tests_only: false)
        return if tests_only

        properties = read_podfile_properties(project_directory)

        pod_lookup_map.each do |pod_name, info|
          condition = info[:autolink_when]
          next unless condition
          next if target_definition.dependencies.any? { |dep| dep.name == pod_name }

          property = condition['podfileProperty']
          disabled_value = condition['disabledValue']
          next unless property

          current_value = properties[property]
          # Only skip if the property is explicitly set to the disabled value
          next if current_value == disabled_value

          podspec_file = File.join(info[:podspec_dir], "#{pod_name}.podspec")
          unless File.exist?(podspec_file)
            Pod::UI.warn "[Expo] Companion pod #{pod_name}: podspec not found at #{podspec_file}"
            next
          end

          podspec_rel = Pathname.new(podspec_file).relative_path_from(project_directory).to_s

          # Parse the companion podspec to inspect its dependencies.
          begin
            spec = Pod::Specification.from_file(podspec_file)
          rescue => e
            Pod::UI.warn "[Expo] Companion pod #{pod_name}: failed to parse podspec: #{e.message}"
            next
          end

          # Skip companion pods whose local dependencies (sibling pods from the same
          # monorepo / node_modules) aren't registered in the Podfile. For example,
          # ExpoCameraBarcodeScanning depends on ExpoCamera — if expo-camera isn't
          # installed in the project, ExpoCamera won't be in the Podfile and CocoaPods
          # would fail with "Unable to find a specification for ExpoCamera".
          registered_pod_names = target_definition.dependencies.map(&:name)
          missing_local_dep = spec.all_dependencies.find do |dep|
            root_spec_name = dep.name.partition('/').first
            pod_lookup_map.key?(root_spec_name) && !registered_pod_names.include?(root_spec_name)
          end
          if missing_local_dep
            Pod::UI.message "[Expo] Skipping companion pod #{pod_name}: dependency #{missing_local_dep.name} is not installed"
            next
          end

          # Enable modular headers for the companion pod's transitive Objective-C dependencies so
          # the Swift pod can `import` them. Mirrors the logic in autolinking_manager.rb's
          # `use_modular_headers_for_dependencies`.
          spec.all_dependencies.each do |dep|
            root_spec_name = dep.name.partition('/').first
            unless target_definition.build_pod_as_module?(root_spec_name)
              target_definition.set_use_modular_headers_for_pod(root_spec_name, true)
            end
          end

          if enabled? && has_prebuilt_xcframework?(pod_name)
            Pod::UI.message "— #{pod_name.green} (prebuilt companion, gated by #{property})"
            podfile.pod(pod_name, :podspec => podspec_rel)
          else
            Pod::UI.message "— #{pod_name.green} (companion, gated by #{property})"
            podspec_dir_rel = Pathname.new(info[:podspec_dir]).relative_path_from(project_directory).to_s
            podfile.pod(pod_name, :path => podspec_dir_rel)
          end
        end
      end

      # Reads Podfile.properties.json from the Podfile's directory (installation root).
      # Returns an empty hash if the file doesn't exist or fails to parse.
      def read_podfile_properties(_project_directory)
        props_path = File.join(Pod::Config.instance.installation_root.to_s, 'Podfile.properties.json')
        return {} unless File.exist?(props_path)
        JSON.parse(File.read(props_path)) rescue {}
      end

      # ──────────────────────────────────────────────────────────────────────
      # Spec patching (called from sandbox.rb / podspecs)
      # ──────────────────────────────────────────────────────────────────────

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

        log_linking_status(spec.name, true, default_tarball)

        spec.source = { :http => URI::File.build(path: default_tarball).to_s, :flatten => false }
        spec.vendored_frameworks = build_vendored_paths(product_name, pod_info, spec.name)

        extra_fw_paths = framework_search_paths_for_skipped_deps(spec.name, pod_info)
        if extra_fw_paths.any?
          spec.pod_target_xcconfig ||= {}
          existing = spec.pod_target_xcconfig['FRAMEWORK_SEARCH_PATHS'] || '$(inherited)'
          spec.pod_target_xcconfig['FRAMEWORK_SEARCH_PATHS'] = ([existing] + extra_fw_paths).join(' ')
        end

        strip_bundled_deps_from_spec(spec, pod_info)

        spec.prepare_command = prepare_command_script(product_name, pod_info[:build_output_dir])
        add_script_phases(spec, product_name, pod_info)

        true
      end

      # Takes a fully-evaluated podspec (with source-build attributes set),
      # converts it to JSON, patches it for precompiled xcframework usage,
      # and returns a new Pod::Specification.
      #
      # @param spec [Pod::Specification] The podspec to patch
      # @return [Pod::Specification] A new patched specification (or original on failure)
      def patch_spec_for_prebuilt(spec)
        resolved = resolve_prebuilt_info(spec.name)
        return spec unless resolved

        pod_info, product_name, default_tarball = resolved

        log_linking_status(spec.name, true, default_tarball)

        spec_json = JSON.parse(spec.to_pretty_json)

        # Override source to local tarball
        spec_json['source'] = { 'http' => URI::File.build(path: default_tarball).to_s, 'flatten' => false }
        spec_json['vendored_frameworks'] = build_vendored_paths(product_name, pod_info, spec.name)

        # Clear source-build attributes
        %w[source_files exclude_files static_framework header_dir
           header_mappings_dir private_header_files compiler_flags].each do |attr|
          spec_json.delete(attr)
        end

        # Clear platform-specific source attributes
        clear_platform_source_attributes(spec_json)

        # Remove subspecs and testspecs (source file groupings / test files not in tarball)
        spec_json.delete('subspecs')
        spec_json.delete('testspecs')

        strip_bundled_deps_from_json(spec_json, pod_info, spec.name)

        spec_json['prepare_command'] = prepare_command_script(product_name, pod_info[:build_output_dir])
        spec_json['script_phases'] = build_script_phases_json(spec.name, product_name, pod_info)

        # Ensure DEFINES_MODULE is set
        spec_json['pod_target_xcconfig'] ||= {}
        spec_json['pod_target_xcconfig']['DEFINES_MODULE'] = 'YES'

        # Add framework search paths for shared SPM deps owned by another prebuilt pod
        extra_fw_paths = framework_search_paths_for_skipped_deps(spec.name, pod_info)
        if extra_fw_paths.any?
          existing = spec_json['pod_target_xcconfig']['FRAMEWORK_SEARCH_PATHS'] || '$(inherited)'
          spec_json['pod_target_xcconfig']['FRAMEWORK_SEARCH_PATHS'] = ([existing] + extra_fw_paths).join(' ')
        end

        Pod::Specification.from_json(spec_json.to_json)
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

        stub_source_files_to_headers(spec_json)

        (spec_json['subspecs'] || []).each do |subspec|
          stub_source_files_to_headers(subspec)
        end

        Pod::Specification.from_json(spec_json.to_json)
      end

      # Prints a consolidated summary of all precompiled module linking results.
      def print_linking_summary
        return unless @linked_pods&.any?

        prefix = "[Expo-precompiled] ".blue
        Pod::UI.info "#{prefix}Precompiled modules:"
        @linked_pods.sort_by { |name, _| name.downcase }.each do |pod_name, info|
          if info[:found]
            Pod::UI.info "#{prefix}  📦 #{pod_name.green}"
          else
            Pod::UI.info "#{prefix}  ⚠️  #{pod_name} #{"(Build from source: framework not found #{info[:path]})".yellow}"
          end
          info[:spm_deps].each do |dep_name|
            Pod::UI.info "#{prefix}      ∟ #{dep_name}.xcframework".green
          end
        end

        if @linked_pods.none? { |_, info| info[:found] }
          Pod::UI.warn "#{prefix}⚠️  Precompiled modules enabled but no xcframeworks found. All modules will build from source."
        end
      end

      # ──────────────────────────────────────────────────────────────────────
      # Post-install configuration steps
      # ──────────────────────────────────────────────────────────────────────

      # Copies flavor tarballs into Pods/<PodName>/artifacts/ for all precompiled pods.
      # Called from post_install which runs reliably on every pod install, unlike
      # prepare_command which CocoaPods skips for "unchanged" pods.
      #
      # @param installer [Pod::Installer] The CocoaPods installer instance
      def ensure_artifacts(installer)
        return unless enabled?

        pods_root = installer.sandbox.root

        pod_lookup_map.each do |pod_name, info|
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
            FileUtils.cp(src, dst) if File.exist?(src) && !File.exist?(dst)
          end

          # Write initial .last_build_configuration if missing
          last_config_file = File.join(artifacts_dir, '.last_build_configuration')
          File.write(last_config_file, build_flavor) unless File.exist?(last_config_file)

          # Self-healing: extract xcframework if missing (CocoaPods cache issue)
          xcframework_dir = File.join(pod_dir, "#{product_name}.xcframework")
          unless File.directory?(xcframework_dir)
            tarball = File.join(build_output_dir, build_flavor, 'xcframeworks', "#{product_name}.tar.gz")
            if File.exist?(tarball)
              Pod::UI.info "#{'[Expo-precompiled] '.blue}Extracting #{product_name}.xcframework (cache miss)"
              system("tar", "xzf", tarball, "-C", pod_dir)
            end
          end
        end
      end

      # Prevents swiftinterface verification failures when BUILD_LIBRARY_FOR_DISTRIBUTION=YES
      # is propagated from brownfield/framework user targets to pod targets by CocoaPods 1.16+.
      def disable_swift_interface_verification(installer)
        return unless prebuilt_react_active?

        Pod::UI.puts "[Expo] ".blue + "Disabling SWIFT_EMIT_MODULE_INTERFACE for pod targets (prebuilt React compatibility)"

        installer.pod_targets.each do |pod_target|
          pod_target.build_settings.each do |config_name, _|
            xcconfig_path = pod_target.xcconfig_path(config_name)
            next unless File.exist?(xcconfig_path)

            content = File.read(xcconfig_path)
            next if content.include?('SWIFT_EMIT_MODULE_INTERFACE')

            File.open(xcconfig_path, 'a') do |f|
              f.puts 'SWIFT_EMIT_MODULE_INTERFACE = NO'
            end
          end
        end
      end

      # Configures use_frameworks! compatibility for prebuilt React.xcframework.
      # With use_frameworks!, the framework's modulemap resolves <React/X.h> to DerivedData
      # paths the VFS doesn't cover. This method:
      # 1. Creates a non-framework modulemap so <React/X.h> resolves through -isystem + VFS
      # 2. Patches framework modulemaps to remove `framework module React` (keep React_RCTAppDelegate)
      # 3. Injects -isystem and -fmodule-map-file into all pod and aggregate xcconfigs
      #
      # The modulemap is placed in Target Support Files/ rather than in the pod
      # directory itself, because React Native's replace-rncore-version.js script
      # phase deletes and re-extracts the entire React-Core-prebuilt/ directory at
      # build time when switching Debug↔Release configurations.
      def configure_use_frameworks(installer)
        return unless prebuilt_react_active?
        return if linkage(installer).nil?

        react_prebuilt_dir = File.join(installer.sandbox.root, 'React-Core-prebuilt')
        xcframework_path = File.join(react_prebuilt_dir, 'React.xcframework')
        return unless File.exist?(xcframework_path)

        target_support_dir = File.join(installer.sandbox.root, 'Target Support Files', 'React-Core-prebuilt')
        FileUtils.mkdir_p(target_support_dir)

        create_nonframework_modulemap(target_support_dir, installer.sandbox.root)
        patch_framework_modulemaps(xcframework_path)
        inject_isystem_flags(installer, target_support_dir)

        Pod::UI.puts "[Expo] ".blue + "Created non-framework React modulemap for use_frameworks! compatibility"
      end

      # TODO(ExpoModulesJSI-xcframework): Remove this method when ExpoModulesJSI.xcframework
      # is built and distributed separately. At that point, pods can depend on ExpoModulesJSI
      # directly and this header search path workaround won't be needed.
      #
      # Configures header search paths for prebuilt XCFrameworks in the post_install phase.
      # When using prebuilt modules, ExpoModulesJSI headers are bundled inside
      # ExpoModulesCore.xcframework. This method adds the necessary header search paths
      # to all pod targets so that `#import <ExpoModulesJSI/...>` works correctly.
      #
      # @param installer [Pod::Installer] The CocoaPods installer instance
      def configure_header_search_paths(installer)
        return unless enabled?

        expo_core_xcframework = find_expo_modules_core_xcframework(installer)
        return unless expo_core_xcframework

        header_search_paths = collect_xcframework_header_paths(expo_core_xcframework)
        return if header_search_paths.empty?

        paths_string = header_search_paths.map { |p| "\"#{p}\"" }.join(' ')

        Pod::UI.info "#{'[Expo-precompiled] '.blue}Adding ExpoModulesJSI header search paths to all targets"

        # Modify xcconfig files directly - these take precedence over Xcode project settings
        target_support_files_dir = File.join(installer.sandbox.root, 'Target Support Files')
        Dir.glob(File.join(target_support_files_dir, '**', '*.xcconfig')).each do |xcconfig_path|
          update_xcconfig_header_search_paths(xcconfig_path, paths_string)
        end

        # Also update the main project targets' build settings directly
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
      # Removes source file references for prebuilt libraries from the compile sources phase
      # and adds a shell script build phase to clean up regenerated codegen files.
      def configure_codegen_for_prebuilt_modules(installer)
        return unless enabled?

        script_phase_name = '[Expo] Remove duplicate codegen output'
        react_codegen_target = installer.pods_project.targets.find { |target| target.name == 'ReactCodegen' }

        unless react_codegen_target
          Pod::UI.puts "[Expo] ".yellow + "ReactCodegen target not found in pods project"
          return
        end

        already_exists = react_codegen_target.build_phases.any? do |phase|
          phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase) && phase.name == script_phase_name
        end

        codegen_exclusions = codegen_exclusion_list(installer.pod_targets)

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

      # Removes implementation files from compile phases of pod targets that are bundled
      # inside prebuilt xcframeworks. This handles CDN pods (like SDWebImage) that don't
      # go through the store_podspec hook.
      #
      # @param installer [Pod::Installer] The CocoaPods installer instance
      def stub_bundled_pod_targets(installer)
        return unless enabled?

        bundled = all_bundled_frameworks
        return if bundled.empty?

        stubbed_lib_names = Set.new

        installer.pods_project.targets.each do |target|
          target_root = target.name.split('-').first.split('/').first
          next unless bundled.include?(target.name) || bundled.include?(target_root)

          compile_phase = target.build_phases.find { |p| p.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase) }
          next unless compile_phase

          files_removed = 0
          compile_phase.files.to_a.each do |build_file|
            file_ref = build_file.file_ref
            next unless file_ref

            path = file_ref.path.to_s
            if SOURCE_FILE_EXTENSIONS.any? { |ext| path.end_with?(ext) }
              compile_phase.files.delete(build_file)
              files_removed += 1
            end
          end

          if files_removed > 0
            stubbed_lib_names.add(target.name)
            Pod::UI.puts "#{'[Expo-precompiled] '.blue}Stubbed '#{target.name}': removed #{files_removed} source files from compile phase"
          end
        end

        if stubbed_lib_names.any?
          remove_linker_flags_for_stubbed_libs(installer, stubbed_lib_names)
        end

        installer.pods_project.save
      end

      private

      # ──────────────────────────────────────────────────────────────────────
      # Helpers: common checks
      # ──────────────────────────────────────────────────────────────────────

      # Returns true when the prebuilt React.xcframework is in use.
      def prebuilt_react_active?
        ENV['RCT_USE_PREBUILT_RNCORE'] == '1'
      end

      # ──────────────────────────────────────────────────────────────────────
      # Helpers: use_frameworks! configuration
      # ──────────────────────────────────────────────────────────────────────

      # Creates a non-framework modulemap so <React/X.h> resolves through -isystem + VFS.
      def create_nonframework_modulemap(target_support_dir, pods_root)
        modulemap_path = File.join(target_support_dir, 'React-use-frameworks.modulemap')
        umbrella_header = File.join(pods_root, 'React-Core-prebuilt', 'React.xcframework', 'Headers', 'React_Core', 'React_Core-umbrella.h')
        modulemap_content = <<~MODULEMAP
          module React {
            umbrella header "#{umbrella_header}"
            export *
          }
        MODULEMAP
        File.write(modulemap_path, modulemap_content)
      end

      # Patches framework modulemaps to remove `framework module React` but keep
      # `framework module React_RCTAppDelegate` (its umbrella uses quoted includes).
      def patch_framework_modulemaps(xcframework_path)
        Dir.glob(File.join(xcframework_path, '*/React.framework/Modules/module.modulemap')).each do |fw_modulemap|
          content = File.read(fw_modulemap)
          content.gsub!(FRAMEWORK_MODULE_REACT_REGEX, '')
          File.write(fw_modulemap, content)
        end

        shared_modulemap = File.join(xcframework_path, 'Modules', 'module.modulemap')
        if File.exist?(shared_modulemap)
          content = File.read(shared_modulemap)
          content.gsub!(FRAMEWORK_MODULE_REACT_REGEX, '')
          File.write(shared_modulemap, content)
        end
      end

      # Injects -fmodule-map-file and -isystem into all pod and aggregate xcconfigs.
      # Module builds don't inherit -I (HEADER_SEARCH_PATHS) but DO inherit -isystem.
      def inject_isystem_flags(installer, target_support_dir)
        modulemap_flag = "-fmodule-map-file=\"${PODS_ROOT}/Target\\ Support\\ Files/React-Core-prebuilt/React-use-frameworks.modulemap\""
        extra_isystem = "-isystem \"${PODS_ROOT}/React-Core-prebuilt/React.xcframework/Headers\""
        swift_modulemap = "-Xcc -fmodule-map-file=\"${PODS_ROOT}/Target\\ Support\\ Files/React-Core-prebuilt/React-use-frameworks.modulemap\""
        swift_extra_isystem = "-Xcc -isystem -Xcc \"${PODS_ROOT}/React-Core-prebuilt/React.xcframework/Headers\""
        skip_marker = 'React-use-frameworks.modulemap'

        # Patch pod target xcconfigs
        installer.pod_targets.each do |pod_target|
          pod_target.build_settings.each do |config_name, _|
            xcconfig_path = pod_target.xcconfig_path(config_name)
            next unless File.exist?(xcconfig_path)

            content = File.read(xcconfig_path)
            next if content.include?(skip_marker)

            all_isystem_paths = extract_isystem_paths(content)
            isystem_flags = all_isystem_paths.map { |p| "-isystem \"#{p}\"" }.join(' ') + " #{extra_isystem}"
            swift_isystem = all_isystem_paths.map { |p| "-Xcc -isystem -Xcc \"#{p}\"" }.join(' ') + " #{swift_extra_isystem}"

            inject_flags_into_xcconfig(content, isystem_flags, modulemap_flag, swift_isystem, swift_modulemap)
            File.write(xcconfig_path, content)
          end
        end

        # Patch aggregate target xcconfigs (these flow to the app target)
        installer.aggregate_targets.each do |agg_target|
          agg_target.user_build_configurations.each_key do |config_name|
            xcconfig_path = agg_target.xcconfig_path(config_name)
            next unless File.exist?(xcconfig_path)

            content = File.read(xcconfig_path)
            next if content.include?(skip_marker)

            inject_flags_into_xcconfig(content, extra_isystem, modulemap_flag, swift_extra_isystem, swift_modulemap)
            File.write(xcconfig_path, content)
          end
        end
      end

      # Extracts header and framework search paths from xcconfig content for -isystem conversion.
      def extract_isystem_paths(content)
        paths = []
        if content =~ /HEADER_SEARCH_PATHS\s*=\s*(.*)/
          paths += $1.scan(/"([^"]+)"/).flatten
        end
        if content =~ /FRAMEWORK_SEARCH_PATHS\s*=\s*(.*)/
          $1.scan(/"([^"]+)"/).flatten.each do |fw_dir|
            basename = fw_dir.split('/').last
            paths << "#{fw_dir}/#{basename}.framework/Headers"
          end
        end
        paths
      end

      # Injects C and Swift flags into xcconfig content (mutates in place).
      def inject_flags_into_xcconfig(content, c_isystem, c_modulemap, swift_isystem, swift_modulemap)
        if content.include?('OTHER_CFLAGS')
          content.gsub!(/(OTHER_CFLAGS\s*=\s*)(.*)/) { "#{$1}#{$2} #{c_isystem} #{c_modulemap}" }
        end
        if content.include?('OTHER_SWIFT_FLAGS')
          content.gsub!(/(OTHER_SWIFT_FLAGS\s*=\s*)(.*)/) { "#{$1}#{$2} #{swift_isystem} #{swift_modulemap}" }
        end
      end

      # ──────────────────────────────────────────────────────────────────────
      # Helpers: spec patching
      # ──────────────────────────────────────────────────────────────────────

      # Clears platform-specific source attributes from a spec JSON hash.
      def clear_platform_source_attributes(spec_json)
        APPLE_PLATFORMS.each do |platform|
          next unless spec_json[platform].is_a?(Hash)
          %w[source_files exclude_files private_header_files
             header_dir header_mappings_dir compiler_flags vendored_frameworks].each do |attr|
            spec_json[platform].delete(attr)
          end
          spec_json.delete(platform) if spec_json[platform].empty?
        end
      end

      # Replaces source_files with header-only patterns in a spec or subspec JSON hash.
      def stub_source_files_to_headers(json)
        if json['source_files']
          json['source_files'] = header_only_pattern(json['source_files'])
        end

        APPLE_PLATFORMS.each do |platform|
          next unless json[platform].is_a?(Hash) && json[platform]['source_files']
          json[platform]['source_files'] = header_only_pattern(json[platform]['source_files'])
        end
      end

      # Converts source_files patterns to header-only patterns.
      #
      # @param patterns [String, Array<String>] Original source_files patterns
      # @return [Array<String>] Patterns matching only header files
      def header_only_pattern(patterns)
        patterns = [patterns] unless patterns.is_a?(Array)
        patterns.map do |p|
          p.gsub(/\.\{[^}]+\}/, '.{h,hpp}')
           .gsub(/\*\.(m|mm|swift|c|cpp)$/, '*.{h,hpp}')
        end.uniq
      end

      # Strips dependencies on SPM packages bundled in the xcframework from a spec JSON hash.
      #
      # @param spec_json [Hash] The podspec as a parsed JSON hash (modified in place)
      # @param pod_info [Hash] Package info from spm.config.json lookup
      # @param pod_name [String] Pod name for logging
      def strip_bundled_deps_from_json(spec_json, pod_info, pod_name)
        bundled = bundled_framework_set(pod_info)
        return if bundled.empty? || !spec_json['dependencies'].is_a?(Hash)

        strip_matching_dependencies(spec_json['dependencies'], bundled, pod_name)
        spec_json.delete('dependencies') if spec_json['dependencies'].empty?
      end

      # Strips dependencies on SPM packages bundled in the xcframework from a live spec object.
      #
      # NOTE: Pod::Specification doesn't expose a public API to remove dependencies,
      # so we modify the attributes_hash directly.
      #
      # @param spec [Pod::Specification] The podspec to modify
      # @param pod_info [Hash] Package info from spm.config.json lookup
      def strip_bundled_deps_from_spec(spec, pod_info)
        bundled = bundled_framework_set(pod_info)
        return if bundled.empty?

        deps = spec.attributes_hash['dependencies']
        return unless deps.is_a?(Hash)

        strip_matching_dependencies(deps, bundled, spec.name)
      end

      # Returns the set of bundled framework names from pod_info.
      def bundled_framework_set(pod_info)
        (pod_info[:spm_dependency_frameworks] || []).to_set
      end

      # Deletes dependencies whose name (or root name) matches the bundled set.
      def strip_matching_dependencies(deps_hash, bundled, pod_name)
        deps_hash.delete_if do |dep_name, _|
          root_name = dep_name.split('/').first
          if bundled.include?(dep_name) || bundled.include?(root_name)
            Pod::UI.puts "#{'[Expo-precompiled] '.blue}Stripping bundled dependency '#{dep_name}' from #{pod_name}"
            true
          else
            false
          end
        end
      end

      # Builds the vendored_frameworks paths array for a prebuilt pod.
      # Deduplicates shared SPM dependency frameworks across multiple prebuilt pods:
      # the first pod to claim a framework "owns" it; subsequent pods skip it and
      # instead get FRAMEWORK_SEARCH_PATHS pointing at the owning pod's directory.
      #
      # @param product_name [String] The product/module name
      # @param pod_info [Hash] Package info from spm.config.json lookup
      # @param pod_name [String] The pod name (for summary tracking)
      # @return [Array<String>] vendored framework paths
      def build_vendored_paths(product_name, pod_info, pod_name)
        @claimed_vendored_frameworks ||= Set.new
        @framework_owner_map ||= {}

        paths = ["#{product_name}.xcframework"]
        @claimed_vendored_frameworks.add(product_name)
        @framework_owner_map[product_name] = pod_name

        (pod_info[:spm_dependency_frameworks] || []).each do |dep_name|
          if @claimed_vendored_frameworks.include?(dep_name)
            owner = @framework_owner_map[dep_name]
            Pod::UI.puts "#{'[Expo-precompiled] '.blue}Skipping #{dep_name}.xcframework from #{pod_name} — already vendored by #{owner}"
          else
            paths << "#{dep_name}.xcframework"
            @claimed_vendored_frameworks.add(dep_name)
            @framework_owner_map[dep_name] = pod_name
          end
          log_spm_dependency(pod_name, dep_name)
        end
        paths
      end

      # Returns FRAMEWORK_SEARCH_PATHS entries for shared SPM dependency frameworks
      # that were claimed by another prebuilt pod. The non-owning pod needs these
      # paths so the linker can find the xcframeworks at build time.
      #
      # @param pod_name [String] The pod name
      # @param pod_info [Hash] Package info from spm.config.json lookup
      # @return [Array<String>] framework search path entries
      def framework_search_paths_for_skipped_deps(pod_name, pod_info)
        @claimed_vendored_frameworks ||= Set.new
        @framework_owner_map ||= {}

        paths = []
        (pod_info[:spm_dependency_frameworks] || []).each do |dep_name|
          owner = @framework_owner_map[dep_name]
          if owner && owner != pod_name
            paths << "\"${PODS_ROOT}/#{owner}\""
          end
        end
        paths.uniq
      end

      # ──────────────────────────────────────────────────────────────────────
      # Helpers: script phases
      # ──────────────────────────────────────────────────────────────────────

      # Builds the switch and dSYM script phases as JSON-compatible hashes.
      #
      # @param spec_name [String] The pod name
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
          'script' => dsym_resolve_script(product_name, xcframeworks_dir_var, dsym_script_path, pod_info[:npm_package], package_root_var),
        }

        [switch_phase, dsym_phase]
      end

      # Adds script phases to the podspec for xcframework switching and dSYM resolution.
      # Converts string keys to symbols (CocoaPods inline API uses symbols).
      def add_script_phases(spec, product_name, pod_info)
        json_phases = build_script_phases_json(spec.name, product_name, pod_info)
        spec.script_phases = json_phases.map do |phase|
          phase.each_with_object({}) do |(k, v), h|
            h[k.to_sym] = k == 'execution_position' ? v.to_sym : v
          end
        end
      end

      # Generates the prepare_command shell script.
      def prepare_command_script(product_name, build_output_dir)
        <<~SH
          # Self-healing: extract xcframework from tarball if CocoaPods cache was stale/empty
          if [ ! -d "#{product_name}.xcframework" ]; then
            TARBALL="#{build_output_dir}/#{build_flavor}/xcframeworks/#{product_name}.tar.gz"
            if [ -f "$TARBALL" ]; then
              echo "[Expo XCFramework] #{product_name}: Extracting xcframework from build output (cache miss)"
              tar xzf "$TARBALL"
            fi
          fi
        SH
      end

      # Returns the shell script for the xcframework switch phase.
      def xcframework_switch_script(product_name, xcframeworks_dir, script_path)
        <<~SH
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
        SH
      end

      # Returns the shell script for the dSYM source map resolution phase.
      def dsym_resolve_script(product_name, xcframeworks_dir, script_path, npm_package, package_root)
        <<~SH
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
        SH
      end

      # ──────────────────────────────────────────────────────────────────────
      # Helpers: pod lookup map
      # ──────────────────────────────────────────────────────────────────────

      # Builds and caches a map from pod names to package information.
      # Scans all spm.config.json files in:
      #   - packages/*/spm.config.json (internal Expo packages)
      #   - external-configs/ios/*/spm.config.json (3rd-party packages, bundled with autolinking)
      #
      # @return [Hash] Map of podName -> { type:, npm_package:, podspec_dir:, build_output_dir:, ... }
      def pod_lookup_map
        return @pod_lookup_map if @pod_lookup_map

        @pod_lookup_map = {}
        repo_root = find_repo_root

        if repo_root
          scan_spm_configs(repo_root)
        else
          # Standalone project: discover spm.config.json from node_modules instead of packages/.
          # Prebuilds are resolved from EXPO_PRECOMPILED_MODULES_PATH if set,
          # otherwise from prebuilds/ bundled inside each package directory.
          project_root = File.dirname(Dir.pwd) # Dir.pwd is ios/ during pod install
          scan_node_modules_configs(project_root)
        end

        @pod_lookup_map
      end

      # Scans all spm.config.json files and populates @pod_lookup_map.
      # Used in monorepo context where find_repo_root succeeds.
      def scan_spm_configs(repo_root)
        # Internal Expo packages: packages/*/spm.config.json
        Dir.glob(File.join(repo_root, 'packages', '*', 'spm.config.json')).each do |config_path|
          process_spm_config(config_path, :internal, repo_root)
        end

        # External 3rd-party packages: bundled in external-configs/ios/
        scan_external_configs(repo_root)
      end

      # Scans node_modules for spm.config.json files in standalone projects.
      # Used when EXPO_PRECOMPILED_MODULES_PATH is set but no monorepo root is found.
      def scan_node_modules_configs(project_root)
        node_modules = File.join(project_root, 'node_modules')
        return unless File.directory?(node_modules)

        # Internal Expo packages: node_modules/*/spm.config.json
        Dir.glob(File.join(node_modules, '*', 'spm.config.json')).each do |config_path|
          process_spm_config(config_path, :internal, project_root)
        end

        # Internal Expo scoped packages: node_modules/@scope/*/spm.config.json
        Dir.glob(File.join(node_modules, '@*', '*', 'spm.config.json')).each do |config_path|
          process_spm_config(config_path, :internal, project_root)
        end

        # External 3rd-party packages: bundled in external-configs/ios/
        scan_external_configs(project_root)
      end

      # Scans spm.config.json files from external-configs/ios/ for 3rd-party packages
      # (e.g. react-native-screens, react-native-svg) that don't ship their own spm.config.json.
      # Shared by both monorepo and standalone project paths.
      #
      # @param effective_root [String] The project or repo root used to locate node_modules
      def scan_external_configs(effective_root)
        external_configs_dir = File.join(__dir__, '..', '..', 'external-configs', 'ios')
        return unless File.directory?(external_configs_dir)

        node_modules = File.join(effective_root, 'node_modules')

        # Non-scoped: external-configs/ios/*/spm.config.json
        Dir.glob(File.join(external_configs_dir, '*', 'spm.config.json')).each do |config_path|
          npm_package = File.basename(File.dirname(config_path))
          process_external_config(config_path, npm_package, node_modules, effective_root)
        end

        # Scoped: external-configs/ios/@scope/*/spm.config.json
        Dir.glob(File.join(external_configs_dir, '@*', '*', 'spm.config.json')).each do |config_path|
          rel = config_path.sub("#{external_configs_dir}/", '')
          npm_package = File.dirname(rel) # e.g. "@shopify/react-native-skia"
          process_external_config(config_path, npm_package, node_modules, effective_root)
        end
      end

      # Processes a single external spm.config.json for a 3rd-party package.
      def process_external_config(config_path, npm_package, node_modules, effective_root)
        config = JSON.parse(File.read(config_path))
        products = config['products'] || []
        package_root = File.join(node_modules, npm_package)

        # Only process if the package is actually installed
        return unless File.directory?(package_root)

        # Prefer codegenConfig.name from the installed package.json
        installed_codegen_name = nil
        pkg_version = nil
        pkg_json_path = File.join(package_root, 'package.json')
        if File.exist?(pkg_json_path)
          pkg_json = JSON.parse(File.read(pkg_json_path))
          installed_codegen_name = pkg_json.dig('codegenConfig', 'name')
          pkg_version = pkg_json['version']
        end

        base_dir = custom_modules_path || File.join(effective_root, 'packages', 'precompile', PRECOMPILE_BUILD_DIR)

        # Compute versioned output path for 3rd-party packages:
        # <base>/<npm_package>/output/<pkgVersion>/<rnVersion>/<hermesVersion>
        version_prefix = version_prefix_for_external_package(pkg_version)

        products.each do |product|
          pod_name = product['podName']
          next unless pod_name

          product_name = product['name'] || pod_name
          codegen_name = installed_codegen_name || product['codegenName']

          # Use versioned path if versions are available, otherwise fall back to flat path
          if version_prefix
            build_output_dir = File.join(base_dir, npm_package, 'output', version_prefix)
          else
            build_output_dir = File.join(base_dir, npm_package, 'output')
          end

          # Fallback: check for prebuilds bundled inside the package directory (shipped in npm)
          # Try versioned path first, then flat path for backward compatibility
          if !File.directory?(File.join(build_output_dir, build_flavor, 'xcframeworks'))
            bundled_versioned_dir = version_prefix ? File.join(package_root, 'prebuilds', 'output', version_prefix) : nil
            bundled_flat_dir = File.join(package_root, 'prebuilds', 'output')

            if bundled_versioned_dir && File.directory?(bundled_versioned_dir)
              build_output_dir = bundled_versioned_dir
            elsif File.directory?(bundled_flat_dir)
              build_output_dir = bundled_flat_dir
            end
          end

          targets = (product['targets'] || [])
            .select { |t| t['type'] != 'framework' && !t['path']&.start_with?('.build/') }
            .map { |t| { name: t['name'], path: t['path'] } }

          spm_dependency_frameworks = (product['spmPackages'] || []).map { |pkg| pkg['productName'] }.compact

          @pod_lookup_map[pod_name] = {
            type: :external,
            npm_package: npm_package,
            package_root: package_root,
            podspec_dir: package_root,
            build_output_dir: build_output_dir,
            codegen_name: codegen_name,
            product_name: product_name,
            targets: targets,
            spm_dependency_frameworks: spm_dependency_frameworks,
            autolink_when: product['autolinkWhen']
          }
        end
      rescue JSON::ParserError, StandardError => e
        Pod::UI.warn "[Expo-precompiled] Failed to read external config at #{config_path}: #{e.message}"
      end

      # Processes a single spm.config.json file and adds entries to @pod_lookup_map.
      def process_spm_config(config_path, type, repo_root)
        config = JSON.parse(File.read(config_path))
        products = config['products'] || []
        package_dir = File.dirname(config_path)
        npm_package = resolve_npm_package_name(package_dir, type, repo_root)

        products.each do |product|
          pod_name = product['podName']
          next unless pod_name

          @pod_lookup_map[pod_name] = build_pod_info(product, pod_name, npm_package, package_dir, type, repo_root)
        end
      rescue JSON::ParserError, StandardError => e
        Pod::UI.warn "[Expo-precompiled] Failed to read spm.config.json at #{config_path}: #{e.message}"
      end

      # Resolves the npm package name from a package directory.
      # External scoped packages derive it from the path; internal packages read package.json.
      def resolve_npm_package_name(package_dir, type, repo_root)
        if type == :external
          external_dir = File.join(repo_root, 'packages', 'external')
          package_dir.sub("#{external_dir}/", '')
        else
          package_json_path = File.join(package_dir, 'package.json')
          if File.exist?(package_json_path)
            JSON.parse(File.read(package_json_path))['name'] || File.basename(package_dir)
          else
            File.basename(package_dir)
          end
        end
      end

      # Builds a pod info hash for a single product from spm.config.json.
      def build_pod_info(product, pod_name, npm_package, package_dir, type, repo_root)
        product_name = product['name'] || pod_name
        codegen_name = resolve_codegen_name(product, pod_name, npm_package, type, repo_root)
        base_dir = custom_modules_path || File.join(repo_root, 'packages', 'precompile', PRECOMPILE_BUILD_DIR)
        build_output_dir = File.join(base_dir, npm_package, 'output')

        # Fallback: check for prebuilds bundled inside the package directory (shipped in npm)
        bundled_output_dir = File.join(package_dir, 'prebuilds', 'output')
        if !File.directory?(build_output_dir) && File.directory?(bundled_output_dir)
          build_output_dir = bundled_output_dir
        end

        package_root, podspec_dir = resolve_package_paths(pod_name, package_dir, npm_package, type, repo_root)

        targets = (product['targets'] || [])
          .select { |t| t['type'] != 'framework' && !t['path']&.start_with?('.build/') }
          .map { |t| { name: t['name'], path: t['path'] } }

        spm_dependency_frameworks = (product['spmPackages'] || []).map { |pkg| pkg['productName'] }.compact

        {
          type: type,
          npm_package: npm_package,
          package_root: package_root,
          podspec_dir: podspec_dir,
          build_output_dir: build_output_dir,
          codegen_name: codegen_name,
          product_name: product_name,
          targets: targets,
          spm_dependency_frameworks: spm_dependency_frameworks,
          autolink_when: product['autolinkWhen']
        }
      end

      # Resolves the codegen module name. For external packages, prefers codegenConfig.name
      # from the installed package.json over spm.config.json's codegenName.
      def resolve_codegen_name(product, pod_name, npm_package, type, repo_root)
        codegen_name = product['codegenName']
        return codegen_name unless type == :external && codegen_name

        ext_pkg_json = File.join(repo_root, 'node_modules', npm_package, 'package.json')
        return codegen_name unless File.exist?(ext_pkg_json)

        begin
          rn_codegen_name = JSON.parse(File.read(ext_pkg_json)).dig('codegenConfig', 'name')
          if rn_codegen_name && rn_codegen_name != codegen_name
            Pod::UI.info "#{'[Expo-precompiled] '.blue}#{pod_name}: using codegenConfig.name '#{rn_codegen_name}' instead of '#{codegen_name}'"
            return rn_codegen_name
          end
        rescue JSON::ParserError
          # Fall back to spm.config.json value
        end

        codegen_name
      end

      # Resolves the package_root and podspec_dir for a pod.
      # @return [Array<String>] [package_root, podspec_dir]
      def resolve_package_paths(pod_name, package_dir, npm_package, type, repo_root)
        if type == :internal
          package_root = package_dir
          ios_podspec = File.join(package_root, 'ios', "#{pod_name}.podspec")
          root_podspec = File.join(package_root, "#{pod_name}.podspec")

          podspec_dir = if File.exist?(ios_podspec)
            File.join(package_root, 'ios')
          elsif File.exist?(root_podspec)
            package_root
          else
            File.join(package_root, 'ios')
          end

          [package_root, podspec_dir]
        else
          package_root = resolve_external_package_root(npm_package, repo_root)
          [package_root, package_root]
        end
      end

      # Resolves the package root for an external (3rd-party) npm package.
      # Tries multiple node_modules locations to support pnpm/yarn workspaces.
      def resolve_external_package_root(npm_package, repo_root)
        # Try repo root node_modules first (works for npm/yarn classic)
        candidate = File.join(repo_root, 'node_modules', npm_package)
        return candidate if File.exist?(candidate)

        # Try resolving from the Podfile directory (works for pnpm workspaces
        # where packages are symlinked in the app's node_modules)
        podfile_dir = Dir.pwd
        project_root = File.dirname(podfile_dir)
        candidate = File.join(project_root, 'node_modules', npm_package)
        return candidate if File.exist?(candidate)

        # Fallback to original path
        File.join(repo_root, 'node_modules', npm_package)
      end

      # Finds the repository root by walking up from the current directory.
      def find_repo_root(start_dir = nil)
        current_dir = start_dir || Dir.pwd

        loop do
          return current_dir if File.directory?(File.join(current_dir, 'packages'))

          parent = File.dirname(current_dir)
          break if parent == current_dir
          current_dir = parent
        end

        nil
      end

      # ──────────────────────────────────────────────────────────────────────
      # Helpers: bundled frameworks
      # ──────────────────────────────────────────────────────────────────────

      # Returns the set of all SPM dependency framework names that are bundled inside
      # prebuilt XCFrameworks. These pods should be stubbed (header-only) when they appear
      # as source pods, to avoid duplicate symbols with the xcframework.
      #
      # @return [Set<String>] Framework names bundled across all prebuilt pods
      def all_bundled_frameworks
        @all_bundled_frameworks ||= begin
          bundled = Set.new
          pod_lookup_map.each do |pod_name, info|
            next unless resolve_prebuilt_info(pod_name)
            (info[:spm_dependency_frameworks] || []).each { |f| bundled.add(f) }
          end
          Pod::UI.puts "#{'[Expo-precompiled] '.blue}Bundled SPM frameworks: #{bundled.to_a.join(', ')}" if bundled.any?
          bundled
        end
      end

      # ──────────────────────────────────────────────────────────────────────
      # Helpers: external prebuilt pods
      # ──────────────────────────────────────────────────────────────────────

      # Returns external (3rd-party) pods that have prebuilt XCFrameworks.
      #
      # @param project_directory [Pathname] The project root for computing relative paths
      # @return [Array<Hash>] Array of {:pod_name, :podspec_path} for external prebuilt pods
      def external_prebuilt_pods(project_directory)
        return [] unless enabled?

        results = []
        pod_lookup_map.each do |pod_name, info|
          next unless info[:type] == :external
          next unless has_prebuilt_xcframework?(pod_name)

          podspec_file = File.join(info[:podspec_dir], "#{pod_name}.podspec")
          next unless File.exist?(podspec_file)

          patched_podspec = generate_prepatched_podspec(pod_name, podspec_file, info)
          next unless patched_podspec

          podspec_rel = Pathname.new(patched_podspec).relative_path_from(project_directory).to_s
          results << { pod_name: pod_name, podspec_path: podspec_rel }
        end

        results
      end

      # Generates a pre-patched podspec JSON file for an external pod.
      def generate_prepatched_podspec(pod_name, podspec_file, info)
        begin
          spec = Pod::Specification.from_file(podspec_file)
        rescue => e
          Pod::UI.warn "[Expo-precompiled] Failed to evaluate podspec for #{pod_name}: #{e.message}"
          return nil
        end

        patched_spec = patch_spec_for_prebuilt(spec)
        return nil if patched_spec.equal?(spec)

        spec_json = JSON.parse(patched_spec.to_pretty_json)
        spec_json.delete('dependencies')

        json_path = podspec_file.sub(/\.podspec$/, '.podspec.json')
        File.write(json_path, JSON.pretty_generate(spec_json))

        json_path
      end

      # ──────────────────────────────────────────────────────────────────────
      # Helpers: version resolution for 3rd-party prebuild versioning
      # ──────────────────────────────────────────────────────────────────────

      # Returns the installed React Native version from node_modules.
      def react_native_version
        @react_native_version ||= begin
          rn_pkg = File.join(find_node_modules_dir, 'react-native', 'package.json')
          File.exist?(rn_pkg) ? JSON.parse(File.read(rn_pkg))['version'] : nil
        end
      end

      # Returns the Hermes version, accounting for Hermes v1 opt-in.
      # Mirrors the TypeScript resolution logic in tools/src/prebuilds/Utils.ts.
      def hermes_version
        @hermes_version ||= begin
          rn_path = File.join(find_node_modules_dir, 'react-native')
          is_v1 = ENV['RCT_HERMES_V1_ENABLED'] == '1'
          version = nil

          # Read from version.properties (primary source)
          props_path = File.join(rn_path, 'sdks', 'hermes-engine', 'version.properties')
          if File.exist?(props_path)
            props = parse_version_properties(props_path)
            version = is_v1 ? props['HERMES_V1_VERSION_NAME'] : props['HERMES_VERSION_NAME']
          end

          # Fallback to tag files
          unless version
            tag_file = is_v1 ? '.hermesv1version' : '.hermesversion'
            tag_path = File.join(rn_path, 'sdks', tag_file)
            version = File.read(tag_path).strip if File.exist?(tag_path)
          end

          # Normalize: strip "hermes-" prefix and "v" prefix
          version&.gsub(/^hermes-?/i, '')&.gsub(/^v/i, '')&.strip
        end
      end

      # Returns the node_modules directory for the project.
      def find_node_modules_dir
        @node_modules_dir ||= begin
          repo_root = find_repo_root
          if repo_root
            File.join(repo_root, 'node_modules')
          else
            File.join(File.dirname(Dir.pwd), 'node_modules')
          end
        end
      end

      # Parses a Java-style .properties file into a Hash.
      def parse_version_properties(file_path)
        props = {}
        File.readlines(file_path).each do |line|
          trimmed = line.strip
          next if trimmed.empty? || trimmed.start_with?('#')
          key, value = trimmed.split('=', 2)
          props[key.strip] = value.strip if key && value
        end
        props
      end

      # Returns the version prefix path for a 3rd-party package.
      # Format: "<packageVersion>/<reactNativeVersion>/<hermesVersion>"
      # Returns nil if versions cannot be resolved.
      def version_prefix_for_external_package(package_version)
        rn_ver = react_native_version
        hermes_ver = hermes_version
        return nil unless package_version && rn_ver && hermes_ver
        File.join(package_version, rn_ver, hermes_ver)
      end

      # ──────────────────────────────────────────────────────────────────────
      # Helpers: prebuilt info resolution
      # ──────────────────────────────────────────────────────────────────────

      # Resolves prebuilt xcframework info for a pod.
      # @return [Array, nil] [pod_info, product_name, tarball_path] or nil
      def resolve_prebuilt_info(pod_name)
        return nil if build_from_source?(pod_name)

        pod_info = pod_lookup_map[pod_name]
        return nil unless pod_info

        product_name = pod_info[:product_name] || pod_name
        tarball = File.join(pod_info[:build_output_dir], build_flavor, 'xcframeworks', "#{product_name}.tar.gz")
        return nil unless File.exist?(tarball)

        [pod_info, product_name, tarball]
      end

      # ──────────────────────────────────────────────────────────────────────
      # Helpers: codegen
      # ──────────────────────────────────────────────────────────────────────

      # Returns the codegenConfig library names for pods that should be excluded from codegen.
      #
      # @param pod_targets [Array<Pod::PodTarget>] The pod targets
      # @return [Array<String>] codegenConfig.name values to exclude from codegen
      def codegen_exclusion_list(pod_targets)
        return [] unless enabled?

        exclusions = []
        pod_lookup_map.each do |pod_name, info|
          next unless info[:type] == :external
          next unless info[:codegen_name]
          next unless resolve_prebuilt_info(pod_name)

          exclusions << info[:codegen_name]
          Pod::UI.info "#{'[Expo-precompiled] '.blue}Found external package '#{info[:npm_package]}' with codegen module: #{info[:codegen_name]}"
        end

        exclusions.uniq
      end

      # Removes source file references for prebuilt libraries from ReactCodegen compile sources.
      def remove_codegen_sources_from_compile_phase(target, codegen_exclusions)
        compile_sources_phase = target.build_phases.find do |p|
          p.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase)
        end
        return unless compile_sources_phase

        files_to_remove = compile_sources_phase.files.select do |build_file|
          file_ref = build_file.file_ref
          next false unless file_ref

          codegen_file_matches_exclusion?(build_file, file_ref, codegen_exclusions)
        end

        if files_to_remove.any?
          Pod::UI.puts "[Expo] ".blue + "Removing #{files_to_remove.count} codegen source files from ReactCodegen compile sources"
          files_to_remove.each { |bf| compile_sources_phase.files.delete(bf) }
        end
      end

      # Checks whether a build file belongs to an excluded codegen library.
      def codegen_file_matches_exclusion?(build_file, file_ref, codegen_exclusions)
        file_path = file_ref.path.to_s
        display_name = build_file.display_name.to_s
        parent_name = (file_ref.respond_to?(:parent) && file_ref.parent) ? (file_ref.parent.name.to_s rescue '') : ''

        codegen_exclusions.any? do |lib|
          file_path.start_with?("#{lib}-") ||
            file_path.start_with?("#{lib}JSI") ||
            display_name.start_with?("#{lib}-") ||
            display_name.start_with?("#{lib}JSI") ||
            file_path.include?("/#{lib}/") ||
            file_path.start_with?("#{lib}/") ||
            parent_name == lib
        end
      end

      # Adds a shell script build phase to clean up codegen output for prebuilt libraries.
      def add_codegen_cleanup_script_phase(target, phase_name, codegen_exclusions)
        codegen_cleanup_list = codegen_exclusions.map { |lib| "\"#{lib}\"" }.join(' ')

        phase = target.new_shell_script_build_phase(phase_name)
        phase.shell_path = '/bin/sh'
        phase.shell_script = codegen_cleanup_shell_script(codegen_cleanup_list)
        phase.input_paths = ['$(PODS_ROOT)/../build/generated/autolinking/autolinking.json']
        phase.output_paths = ['$(DERIVED_FILE_DIR)/expo-codegen-cleanup.stamp']

        compile_sources_index = target.build_phases.find_index do |p|
          p.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase)
        end

        if compile_sources_index
          target.build_phases.delete(phase)
          target.build_phases.insert(compile_sources_index, phase)
        else
          Pod::UI.puts "[Expo] ".yellow + "Could not find 'Compile Sources' phase, build phase added at default position"
        end
      end

      # Returns the shell script content for the codegen cleanup build phase.
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

      # ──────────────────────────────────────────────────────────────────────
      # Helpers: xcconfig / header search paths
      # ──────────────────────────────────────────────────────────────────────

      # Removes -l<lib> linker flags for stubbed libraries from all xcconfig files.
      def remove_linker_flags_for_stubbed_libs(installer, stubbed_lib_names)
        lib_flags = stubbed_lib_names.flat_map { |name| ["-l\"#{name}\"", "-l#{name}"] }
        return if lib_flags.empty?

        xcconfig_dir = File.join(installer.sandbox.root, 'Target Support Files')
        return unless File.directory?(xcconfig_dir)

        Dir.glob(File.join(xcconfig_dir, '**', '*.xcconfig')).each do |xcconfig_path|
          content = File.read(xcconfig_path)
          original = content.dup

          lib_flags.each do |flag|
            content = content.gsub(/\s*#{Regexp.escape(flag)}/, '')
          end

          if content != original
            File.write(xcconfig_path, content)
            Pod::UI.puts "#{'[Expo-precompiled] '.blue}Cleaned linker flags from #{File.basename(File.dirname(xcconfig_path))}/#{File.basename(xcconfig_path)}"
          end
        end
      end

      # TODO(ExpoModulesJSI-xcframework): Remove this method when ExpoModulesJSI.xcframework
      # is built and distributed separately.
      #
      # Updates HEADER_SEARCH_PATHS in an xcconfig file
      def update_xcconfig_header_search_paths(xcconfig_path, paths_string)
        content = File.read(xcconfig_path)

        if content.include?('HEADER_SEARCH_PATHS')
          updated_content = content.gsub(/^(HEADER_SEARCH_PATHS\s*=\s*)(.*)$/) do |match|
            $2.include?(paths_string) ? match : "#{$1}#{$2} #{paths_string}"
          end
          File.write(xcconfig_path, updated_content) if updated_content != content
        else
          File.open(xcconfig_path, 'a') { |f| f.puts "HEADER_SEARCH_PATHS = $(inherited) #{paths_string}" }
        end
      end

      # Finds the ExpoModulesCore.xcframework path from the installer
      def find_expo_modules_core_xcframework(installer)
        installer.pod_targets.each do |target|
          next unless target.name == 'ExpoModulesCore'

          vendored = target.root_spec.attributes_hash['vendored_frameworks']
          next unless vendored

          frameworks = vendored.is_a?(Array) ? vendored : [vendored]
          frameworks.each do |framework|
            if framework.to_s.include?('ExpoModulesCore.xcframework')
              podspec_dir = target.sandbox.pod_dir(target.name)
              framework_path = File.expand_path(framework, podspec_dir)

              Pod::UI.info "#{'[Expo-precompiled] '.blue}Looking for ExpoModulesCore.xcframework at: #{framework_path}"
              return framework_path if File.directory?(framework_path)
            end
          end
        end

        nil
      end

      # Collects header paths from all slices of an XCFramework
      def collect_xcframework_header_paths(xcframework_path)
        return [] unless File.directory?(xcframework_path)

        Dir.children(xcframework_path).filter_map do |slice|
          slice_path = File.join(xcframework_path, slice)
          next unless File.directory?(slice_path)

          framework_headers = File.join(slice_path, 'ExpoModulesCore.framework', 'Headers')
          framework_headers if File.directory?(framework_headers)
        end
      end

      # ──────────────────────────────────────────────────────────────────────
      # Helpers: linking summary tracking
      # ──────────────────────────────────────────────────────────────────────

      # Records the linking status for a pod (only once per pod to avoid duplicates).
      def log_linking_status(pod_name, found, path)
        @linked_pods ||= {}
        return if @linked_pods[pod_name]
        @linked_pods[pod_name] = { found: found, path: path, spm_deps: [] }
      end

      # Records an SPM dependency xcframework bundled inside a precompiled pod.
      def log_spm_dependency(pod_name, dep_name)
        @linked_pods ||= {}
        @linked_pods[pod_name] ||= { found: true, path: nil, spm_deps: [] }
        @linked_pods[pod_name][:spm_deps] << dep_name
      end
    end
  end
end
