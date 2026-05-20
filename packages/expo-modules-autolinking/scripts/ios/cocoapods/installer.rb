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
