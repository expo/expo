# Overrides CocoaPods `PodTarget` class to make the `ReactCommon` pod define a module
# and tell CocoaPods to generate a modulemap for it. This is needed for Swift/JSI integration
# until the upstream podspec add `DEFINES_MODULE => YES` to build settings.
# See: https://github.com/CocoaPods/CocoaPods/blob/master/lib/cocoapods/target/pod_target.rb

module Pod
  class PodTarget

    private

    _original_defines_module = instance_method(:defines_module?)

    public

    # @return [Boolean] Whether the target defines a "module"
    #         (and thus will need a module map and umbrella header).
    #
    # @note   Static library targets can temporarily opt in to this behavior by setting
    #         `DEFINES_MODULE = YES` in their specification's `pod_target_xcconfig`.
    #
    define_method(:defines_module?) do
      # Call the original method
      original_result = _original_defines_module.bind(self).()

      # Make ReactCommon specs define a module. This is required for ExpoModulesCore
      # to use `ReactCommon/turbomodule/core` subspec as a module, from Swift.
      # It also needs to handle versioned pods in Expo Go, so we check if the pod name
      # ends with `ReactCommon` instead of checking if they're equal.
      if !original_result && name.end_with?('ReactCommon')
        root_spec.consumer(platform).pod_target_xcconfig['DEFINES_MODULE'] = 'YES'
        return @defines_module = true
      end

      # Return the original value if not applicable for hack.
      return original_result
    end
  end
end
