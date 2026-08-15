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

    # Pod names of Expo modules registered by `use_expo_modules!`.
    # Used at post-install time to reconcile their deployment targets
    # with ExpoModulesCore's, so an adapter declaring a lower platform
    # value in its podspec doesn't fail the Swift module-import check.
    def expo_autolinked_pod_names
      @expo_autolinked_pod_names ||= []
    end
  end

  class Installer
    private

    _original_run_podfile_pre_install_hooks = instance_method(:run_podfile_pre_install_hooks)
    _original_perform_post_install_actions = instance_method(:perform_post_install_actions)

    public

    define_method(:perform_post_install_actions) do
      # Call original implementation first
      _original_perform_post_install_actions.bind(self).()

      # CocoaPods overrides generate_available_uuid_list to use a fast sequential counter
      # (Pod::Project#generate_available_uuid_list) that skips collision checks. After
      # predictabilize_uuids reassigns all UUIDs to deterministic values, the counter resets
      # and new sequential UUIDs can collide with existing ones, corrupting Pods.xcodeproj.
      # Fix: replace the sequential generator with collision-safe random UUIDs for any
      # objects created after predictabilize_uuids has run.
      project = self.pods_project
      existing_uuids = project.objects_by_uuid.keys.to_set
      project.define_singleton_method(:generate_available_uuid_list) do |count = 100|
        new_uuids = (0..count).map { SecureRandom.hex(12).upcase }
        uniques = new_uuids.reject { |u| existing_uuids.include?(u) || @generated_uuids.include?(u) }
        @generated_uuids += uniques
        @available_uuids += uniques
      end

      # Run all precompiled module post-install configuration
      Expo::PrecompiledModules.perform_post_install(self)

      # Raise every autolinked Expo module's deployment target to at least
      # ExpoModulesCore's. CocoaPods + react_native_post_install only raise
      # pods to RN's iOS floor, which can leave Expo adapters declaring a
      # lower platform value below ExpoModulesCore's requirement, leading to
      # "Compiling for iOS 15.1, but module 'ExpoModulesCore' has a minimum deployment target of iOS 16.4"
      # type of message
      reconcile_expo_module_deployment_targets()

      # Raise each pod's resource bundle targets to the pod's effective
      # deployment target. CocoaPods generates resource bundle targets with
      # the deployment target declared by the pod's own podspec, and
      # `react_native_post_install` raises only the pods' library targets,
      # so a bundle can be left below the minimum supported by the Xcode SDK
      # (e.g. ReachabilitySwift's privacy manifest bundle at iOS 12.0),
      # which fails the build on Xcode 27. Runs after the reconciliation
      # above so bundles of Expo modules pick up the reconciled values.
      reconcile_resource_bundle_deployment_targets()
    end

    define_method(:run_podfile_pre_install_hooks) do
      # Call original implementation first
      _original_run_podfile_pre_install_hooks.bind(self).()

      # ExpoModulesJSI needs a stub xcframework so CocoaPods generates the
      # "[CP] Copy XCFrameworks" build phase. The stub is gitignored and may be
      # absent after a fresh checkout or when CI restores a stale Pods/ cache.
      ensure_expo_modules_jsi_stub_xcframework()

      # Disable use_frameworks! for pods that can't be built as frameworks
      Expo::PrecompiledModules.perform_pre_install(self)

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

    # See call site in perform_post_install_actions for rationale.
    # This runs AFTER the user's `post_install` hook, so it will overwrite any
    # deployment target a consumer set there for an Expo module. That is
    # intentional — the bumped pod list is logged so the override is visible.
    def reconcile_expo_module_deployment_targets
      # Mapping from Pod::Platform symbol to the Xcode build setting key
      # that stores its deployment target and a human-readable label.
      deployment_targets = {
        ios:  { key: 'IPHONEOS_DEPLOYMENT_TARGET', label: 'iOS'   },
        osx:  { key: 'MACOSX_DEPLOYMENT_TARGET',   label: 'macOS' },
        tvos: { key: 'TVOS_DEPLOYMENT_TARGET',     label: 'tvOS'  },
      }

      expo_pod_names = @podfile.expo_autolinked_pod_names.to_set
      return if expo_pod_names.empty?

      core_target = self.pod_targets.find { |t| t.pod_name == 'ExpoModulesCore' }
      core_spec = core_target&.root_spec
      return if core_spec.nil?

      required = deployment_targets
        .map { |platform, info| [info[:key], { label: info[:label], version: core_spec.deployment_target(platform) }] }
        .reject { |_, info| info[:version].nil? || info[:version].empty? }
        .to_h
      return if required.empty?

      bumped = {} # pod_name => Array of bumped platform labels
      self.target_installation_results.pod_target_installation_results.each_value do |result|
        # Keys in pod_target_installation_results are target names, which can
        # differ from pod names under scoped targets — use pod_name explicitly.
        pod_name = result.target.pod_name
        next unless expo_pod_names.include?(pod_name)
        next if pod_name == 'ExpoModulesCore'

        bumped_platforms = []
        result.native_target.build_configurations.each do |config|
          required.each do |key, info|
            current = config.build_settings[key]
            # nil means the pod doesn't target this platform — don't create a setting for it.
            # Empty string, an xcconfig reference (e.g. `$(inherited)`), or a malformed
            # value written by another post_install hook means we can't compare versions,
            # so leave it alone.
            next if current.nil? || current.empty?
            next unless Gem::Version.correct?(current)
            next unless Gem::Version.new(current) < Gem::Version.new(info[:version])
            config.build_settings[key] = info[:version]
            bumped_platforms << info[:label] unless bumped_platforms.include?(info[:label])
          end
        end
        bumped[pod_name] = bumped_platforms unless bumped_platforms.empty?
      end

      unless bumped.empty?
        versions_by_label = required.values.map { |info| [info[:label], info[:version]] }.to_h
        Pod::UI.puts "[Expo] ".blue + "Raised deployment target for Expo modules matching ExpoModulesCore:".yellow
        bumped.each do |pod_name, platforms|
          summary = platforms.map { |label| "#{label}=#{versions_by_label[label]}" }.join(' ')
          Pod::UI.puts "  #{pod_name} (#{summary})".yellow
        end
        self.pods_project.save
      end
    end

    # See call site in perform_post_install_actions for rationale.
    # Bundle targets are only ever raised to their owning pod's library
    # target value, never lowered, so a bundle already declaring a higher
    # deployment target keeps it.
    def reconcile_resource_bundle_deployment_targets
      deployment_target_keys = [
        'IPHONEOS_DEPLOYMENT_TARGET',
        'MACOSX_DEPLOYMENT_TARGET',
        'TVOS_DEPLOYMENT_TARGET',
      ]

      bumped = [] # names of bumped resource bundle targets
      dirty_projects = Set.new
      self.target_installation_results.pod_target_installation_results.each_value do |result|
        library_settings_by_config = result.native_target.build_configurations
          .map { |config| [config.name, config.build_settings] }
          .to_h

        result.resource_bundle_targets.each do |bundle_target|
          bundle_target.build_configurations.each do |config|
            library_settings = library_settings_by_config[config.name]
            next if library_settings.nil?

            deployment_target_keys.each do |key|
              current = config.build_settings[key]
              effective = library_settings[key]
              # nil means the target doesn't build for that platform. Empty
              # strings, xcconfig references (e.g. `$(inherited)`), and
              # malformed values written by another post_install hook can't
              # be compared as versions, so leave those alone.
              next if current.nil? || current.empty? || effective.nil? || effective.empty?
              next unless Gem::Version.correct?(current) && Gem::Version.correct?(effective)
              next unless Gem::Version.new(current) < Gem::Version.new(effective)
              config.build_settings[key] = effective
              dirty_projects << bundle_target.project
              bumped << bundle_target.name unless bumped.include?(bundle_target.name)
            end
          end
        end
      end

      unless bumped.empty?
        Pod::UI.puts "[Expo] ".blue + "Raised resource bundle deployment targets to match their pods: #{bumped.join(', ')}".yellow
        # Save every project that owns a bumped bundle target; with the
        # `generate_multiple_pod_projects` install option those are per-pod
        # projects rather than `pods_project`.
        dirty_projects.each(&:save)
      end
    end

    # Ensures every slice declared by ExpoModulesJSI's podspec exists in
    # `Products/ExpoModulesJSI.xcframework`. CocoaPods only runs
    # prepare_command when a pod is freshly downloaded or its podspec
    # changes, so CI cache hits skip it. This method runs on every pod
    # install to guarantee every declared slice is present — an xcframework
    # with only some slices (e.g. simulator-only after a prior Debug build)
    # breaks the per-slice copy script CocoaPods generates from Info.plist,
    # which then leaves XCFrameworkIntermediates empty for the missing slice
    # and surfaces as `No such module 'ExpoModulesJSI'`.
    #
    # The script itself is idempotent and only stamps slices that are
    # missing, so always invoking it is cheaper than maintaining a separate
    # completeness check that would have to mirror the script's slice list.
    def ensure_expo_modules_jsi_stub_xcframework
      jsi_target = self.pod_targets.find { |t| t.name == 'ExpoModulesJSI' }
      return if jsi_target.nil?

      pod_dir = jsi_target.sandbox.pod_dir('ExpoModulesJSI')
      return unless File.directory?(pod_dir)

      system('./scripts/create-stub-xcframework.sh', chdir: pod_dir.to_s)
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
