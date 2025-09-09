module Expo
  module ReactCorePrebuiltUtils
    module_function

    def pre_install(podfile:, installer:)
      return unless should_disable_use_frameworks_for_core_expo_pods?(podfile, installer)

      # Disable USE_FRAMEWORKS in core targets when USE_FRAMEWORKS is set
      # This method overrides the build_type field to always use static_library for
      # the following pod targets:
      # - ExpoModulesCore, Expo, ReactAppDependencyProvider, expo-dev-menu
      # These are all including files from React Native Core in their public header files,
      # which causes their own modular headers to be invalid.
      installer.pod_targets.each do |t|
        if ['ExpoModulesCore', 'Expo', 'ReactAppDependencyProvider', 'expo-dev-menu'].include?(t.name)
          Pod::UI.puts "[Expo] ".blue + "Disabling USE_FRAMEWORKS for #{t.name}"
          def t.build_type
            Pod::BuildType.static_library
          end
        end
      end
    end

    # ---- internals ----

    # We should only disable USE_FRAMEWORKS for specific pods when:
    # - RCT_USE_PREBUILT_RNCORE is not '1'
    # - build-properties ios.buildReactNativeFromSource is true
    # - USE_FRAMEWORKS is not set
    def should_disable_use_frameworks_for_core_expo_pods?(podfile, installer)
      props = JSON.parse(File.read(File.join(podfile.project_root, 'Podfile.properties.json'))) rescue {}
      return false if ENV['RCT_USE_PREBUILT_RNCORE'] != '1'
      return false if props['ios.buildReactNativeFromSource'] == 'true'
      return true if get_linkage?(installer) != nil
      false
    end

    # Returns the linkage type if USE_FRAMEWORKS is set, otherwise returns nil
    def get_linkage?(installer)
      props = JSON.parse(File.read(File.join(podfile.project_root, 'Podfile.properties.json'))) rescue {}
      linkage_str = (ENV["USE_FRAMEWORKS"] || props['ios.useFrameworks'] || nil)
      return nil if linkage_str == nil
      return :dynamic if linkage_str.downcase == 'dynamic'
      return :static if linkage_str.downcase == 'static'
      nil
    end
  end
end
