# Overrides CocoaPods `Sandbox` class to patch podspecs on the fly
# See: https://github.com/CocoaPods/CocoaPods/blob/master/lib/cocoapods/sandbox.rb

require 'json'
require_relative '../precompiled_modules'

REACT_DEFINE_MODULES_LIST = [
  'React-hermes',
  'React-jsc',
]

module Pod
  class Sandbox
    private

    _original_store_podspec = instance_method(:store_podspec)

    public

    define_method(:store_podspec) do |name, podspec, _external_source, json|
      spec = _original_store_podspec.bind(self).(name, podspec, _external_source, json)
      patched_spec = nil

      # Patch podspecs to define module
      if REACT_DEFINE_MODULES_LIST.include? name
        spec_json = JSON.parse(podspec.to_pretty_json)
        spec_json['pod_target_xcconfig'] ||= {}
        spec_json['pod_target_xcconfig']['DEFINES_MODULE'] = 'YES'
        patched_spec = Specification.from_json(spec_json.to_json)
      end

      # Auto-patch precompiled module specs: if a pod has a prebuilt xcframework
      # and hasn't already been configured via inline try_link_with_prebuilt_xcframework,
      # patch the stored spec to use the xcframework instead of building from source.
      if patched_spec.nil? && Expo::PrecompiledModules.should_auto_patch_spec?(name, spec)
        patched_spec = Expo::PrecompiledModules.patch_spec_for_prebuilt(spec)
      end

      # Stub pods that are bundled inside prebuilt xcframeworks.
      # These pods are compiled into the xcframework as SPM dependencies (e.g., SDWebImage
      # inside ExpoImage.xcframework). If other source pods depend on them, we keep headers
      # for compilation but remove implementation files to avoid duplicate symbols.
      # NOTE: This only works for development pods (:path/:podspec). CDN pods are handled
      # in post_install via stub_bundled_pod_targets.
      if patched_spec.nil? && Expo::PrecompiledModules.bundled_dependency?(name)
        patched_spec = Expo::PrecompiledModules.stub_bundled_pod(spec)
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
