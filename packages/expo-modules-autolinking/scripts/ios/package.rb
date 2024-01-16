
module Expo

  class PackagePod

    # Name of the pod
    attr_reader :pod_name

    # The directory where the podspec is
    attr_reader :podspec_dir

    # Specification of the pod.
    attr_reader :spec

    def initialize(json)
      @pod_name = json['podName']
      @podspec_dir = json['podspecDir']
      @spec = get_podspec_for_pod(self)
    end

    # Checks whether the podspec declares support for the given platform.
    # It compares not only the platform name, but also the deployment target.
    def supports_platform?(platform)
      return platform && @spec.available_platforms().any? do |available_platform|
        next platform.supports?(available_platform)
      end
    end

  end # class PackagePod

  class Package
    
    # Name of the npm package
    attr_reader :name

    # Version of the npm package
    attr_reader :version

    # An array of pods found in the package
    attr_reader :pods

    # Flags to pass to the pod definition
    attr_reader :flags

    # Class names of the modules that need to be included in the generated modules provider.
    attr_reader :modules

    # Whether this module should only be added to the debug configuration.
    attr_reader :debugOnly
    
    def initialize(json)
      @name = json['packageName']
      @version = json['packageVersion']
      @pods = json['pods'].map { |pod| PackagePod.new(pod) }
      @flags = json.fetch('flags', {})
      @modules = json.fetch('modules', [])
      @debugOnly = json['debugOnly']
    end

    def has_swift_modules_to_link?
      return !@modules.empty?
    end

  end # class Package

end # module Expo

private def get_podspec_for_pod(pod)
  podspec_file_path = File.join(pod.podspec_dir, pod.pod_name + ".podspec")
  return Pod::Specification.from_file(podspec_file_path)
end
