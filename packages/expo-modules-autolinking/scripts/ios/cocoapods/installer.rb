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

    _original_run_podfile_pre_install_hooks = instance_method(:run_podfile_pre_install_hooks)

    public

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
