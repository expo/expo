# Overrides CocoaPods `Sandbox` class to patch podspecs on the fly
# See: https://github.com/CocoaPods/CocoaPods/blob/master/lib/cocoapods/sandbox.rb

require 'json'

module Pod
  class Sandbox
    private

    _original_store_podspec = instance_method(:store_podspec)

    public

    define_method(:store_podspec) do |name, podspec, _external_source, json|
      spec = _original_store_podspec.bind(self).(name, podspec, _external_source, json)
      patched_spec = nil

      # Patch `React-Core.podspec` for clang to generate correct submodules for swift integration
      if name == 'React-Core'
        spec_json = JSON.parse(spec.to_pretty_json)

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
        # But React headers are placed in `ios/Pods/Headers/Public/React-Core/React`, so clang cannot find the headers and generate submodules.
        # We patch `React-Core.podspec` to use custom modulemap and use `umbrella "../../Public/React-Core/React"` for clang to generate submodules correctly.
        # Since CocoaPods generates the umbrella headers based on public headers,
        # it is pretty safe to replace the umbrella header with the `umbrella` directory search inside the public headers directory.
        spec_json['module_map'] ||= File.join(__dir__, '..', 'React-Core.modulemap')

        # clang module does not support objc++.
        # We should put Hermes headers inside private headers directory.
        # Otherwise, clang will throw errors in building module.
        hermes_subspec_index = spec_json['subspecs'].index { |subspec| subspec['name'] == 'Hermes' }
        if hermes_subspec_index
          spec_json['subspecs'][hermes_subspec_index]['private_header_files'] ||= [
            'ReactCommon/hermes/executor/*.h',
            'ReactCommon/hermes/inspector/*.h',
            'ReactCommon/hermes/inspector/chrome/*.h',
            'ReactCommon/hermes/inspector/detail/*.h',
          ]
        end

        patched_spec = Specification.from_json(spec_json.to_json)

      # Patch `ReactCommon.podspec` to define module
      elsif name == 'ReactCommon'
        spec_json = JSON.parse(podspec.to_pretty_json)
        spec_json['pod_target_xcconfig']['DEFINES_MODULE'] = 'YES'
        patched_spec = Specification.from_json(spec_json.to_json)
      end

      if patched_spec != nil
        # Store the patched spec with original checksum and local saved file path
        patched_spec.defined_in_file = spec.defined_in_file
        patched_spec.instance_variable_set(:@checksum, spec.checksum)
        @stored_podspecs[spec.name] = patched_spec
        return patched_spec
      end

      return spec
    end # define_method(:store_podspec)

  end # class Sandbox
end # module Pod
