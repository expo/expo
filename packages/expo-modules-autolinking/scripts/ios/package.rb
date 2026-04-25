
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

    # Returns a human-readable string explaining why this pod cannot be linked for the given platform.
    def platform_skip_reason(platform)
      return "no platform specified" unless platform

      matching_by_name = @spec.available_platforms.select do |available|
        available.name == platform.name
      end

      if matching_by_name.empty?
        supported = @spec.available_platforms.map(&:string_name).join(', ')
        return "supports #{supported.empty? ? 'no platforms' : supported} but target is #{platform.string_name}"
      end

      # Pod's minimum deployment target exceeds the app's deployment target.
      required = matching_by_name.map(&:deployment_target).compact.min
      if required
        app_target = platform.deployment_target || 'an unspecified version'
        return "requires #{platform.string_name} #{required} but app targets #{app_target}"
      end

      return "incompatible with #{platform.string_name} #{platform.deployment_target}"
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

    # Names of Swift classes that hooks into `ExpoAppDelegate` to receive AppDelegate life-cycle events.
    attr_reader :appDelegateSubscribers

    # Names of Swift classes that implement `ExpoReactDelegateHandler` to hook React instance creation.
    attr_reader :reactDelegateHandlers

    def initialize(json)
      @name = json['packageName']
      @version = json['packageVersion']
      @pods = json['pods'].map { |pod| PackagePod.new(pod) }
      @flags = json.fetch('flags', {})
      @modules = json.fetch('modules', [])
      @debugOnly = json['debugOnly']
      @appDelegateSubscribers = json.fetch('appDelegateSubscribers', [])
      @reactDelegateHandlers = json.fetch('reactDelegateHandlers', [])
    end

    # Returns a boolean value whether the package has any module, app delegate subscriber or react delegate handler to link.
    def has_something_to_link?
      return !@modules.empty? || !@appDelegateSubscribers.empty? || !@reactDelegateHandlers.empty?
    end

  end # class Package

end # module Expo

private def get_podspec_for_pod(pod)
  podspec_file_path = File.join(pod.podspec_dir, pod.pod_name + ".podspec")
  return Pod::Specification.from_file(podspec_file_path)
end
