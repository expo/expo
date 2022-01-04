module Pod
  module Generator
    class UmbrellaHeader
      private

      _original_generate = instance_method(:generate)

      public

      define_method (:generate) do
        if self.target.is_a?(Pod::PodTarget) && self.target.rewrite_module_dir
          # If we write the `umbrella_header_path`, the import headers are in the same directory,
          # e.g. `#import "React/RCTBridge.h"` -> `#import "RCTBridge.h"`
          self.imports = self.imports.map { |import| import.basename }
        end

        _original_generate.bind(self).()
      end

    end # class UmbrellaHeader
  end # module Generator
end # module Pod
