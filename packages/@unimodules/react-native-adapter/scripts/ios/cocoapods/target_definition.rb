
# Overrides CocoaPods class as the AutolinkingManager is in fact part of
# the target definitions and we need to refer to it at later steps.
# See: https://github.com/CocoaPods/Core/blob/master/lib/cocoapods-core/podfile/target_definition.rb

module Pod
  class Podfile
    class TargetDefinition
      public

      attr_writer :autolinking_manager

      def autolinking_manager
        if @autolinking_manager.present? || root?
          @autolinking_manager
        else
          parent.autolinking_manager
        end
      end
    end
  end
end
