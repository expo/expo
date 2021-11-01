# Overrides CocoaPods class to bypass module dependencies check.
# We want to add vendored reanimated but then expo-dev-menu needs to 
# depend on react modules which don't have modular_headers set. 
module Pod
  class Installer
    class Xcode
      class TargetValidator
        private

        _original_verify_swift_pods_have_module_dependencies = instance_method(:verify_swift_pods_have_module_dependencies)

        define_method(:verify_swift_pods_have_module_dependencies) do
          # save dev-menu target but remove it from pod_targets variable used by orginal implementation
          # see: https://github.com/CocoaPods/CocoaPods/blob/f120f9fabda8bc7bea9995700e358ea22dd71cfe/lib/cocoapods/installer/xcode/target_validator.rb#L129-L153
          dev_menu_target = pod_targets.extract! { |target| target.name == "expo-dev-menu" } 
          # call orginal implementation 
          _original_verify_swift_pods_have_module_dependencies.bind(self).()
          # restore orginal pod_targets for other checks
          pod_targets.push(*dev_menu_target)
        end
      end
    end # class UserProjectIntegrator
  end # class Installer
end # module Pod