# frozen_string_literal: true
class Array
  # Removes and returns the elements for which the block returns a true value.
  # If no block is given, an Enumerator is returned instead.
  #
  #   numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  #   odd_numbers = numbers.extract! { |number| number.odd? } # => [1, 3, 5, 7, 9]
  #   numbers # => [0, 2, 4, 6, 8]
  def expo_extract!
    return to_enum(:extract!) { size } unless block_given?

    extracted_elements = []

    reject! do |element|
      extracted_elements << element if yield(element)
    end

    extracted_elements
  end
end

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
          dev_menu_target = pod_targets.expo_extract! { |target| target.name == "expo-dev-menu" } 
          # call orginal implementation 
          _original_verify_swift_pods_have_module_dependencies.bind(self).()
          # restore orginal pod_targets for other checks
          pod_targets.push(*dev_menu_target)
        end
      end
    end # class UserProjectIntegrator
  end # class Installer
end # module Pod