
module Pod
  class Podfile
    class TargetDefinition
      public

      def autolinking_manager=(autolinking_manager)
        @autolinking_manager = autolinking_manager
      end

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
