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
