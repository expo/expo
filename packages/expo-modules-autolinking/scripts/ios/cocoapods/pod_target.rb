module Pod
  class PodTarget
    private

    _original_module_map_path = instance_method(:module_map_path)

    public

    # CocoaPods's default modulemap did not generate submodules correctly
    # `ios/Pods/Headers/Public/React/React-Core.modulemap`
    # ```
    # module React {
    #   umbrella header "React-Core-umbrella.h"
    #
    #   export *
    #   module * { export * }
    # }
    # ```
    # clang will generate submodules for headers relative to the umbrella header directory.
    # https://github.com/llvm/llvm-project/blob/2782cb8da0b3c180fa7c8627cb255a026f3d25a2/clang/lib/Lex/ModuleMap.cpp#L1133
    # In this case, it is `ios/Pods/Headers/Public/React`.
    # But the React public headers are placed in `ios/Pods/Headers/Public/React-Core/React`, so clang cannot find the headers and generate submodules.
    #
    # This case happens when a pod's name different to its module name, e.g. the pod name is `React-Core` but the module name is `React` since it defines header_dir as `React`.
    # To fix the issue, we rewrite the `module_map_path` and `umbrella_header_path` to be with the public headers,
    # i.e. `ios/Pods/Headers/Public/React-Core/React/React-Core.modulemap` and `ios/Pods/Headers/Public/React-Core/React/React-Core-umbrella.h`
    #
    def rewrite_module_dir
      # strip expo go versioning prefix
      normalized_name = name.gsub(/^ABI\d+_\d+_\d+/, '')

      if ['React-Core', 'React-RCTFabric'].include?(normalized_name) && product_module_name != name
        return sandbox.public_headers.root + name + product_module_name
      end
      return nil
    end

    def umbrella_header_path
      if dir = self.rewrite_module_dir
        return dir + "#{label}-umbrella.h"
      end
      super
    end

    define_method(:module_map_path) do
      if dir = self.rewrite_module_dir
        return dir + "#{label}.modulemap"
      end
      _original_module_map_path.bind(self).()
    end

  end # class PodTarget
end # module Pod
