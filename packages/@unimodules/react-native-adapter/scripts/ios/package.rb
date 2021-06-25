
module Expo
  class Package
    
    # Name of the npm package
    attr_reader :name

    # Version of the npm package
    attr_reader :version

    # Name of the pod
    attr_reader :pod_name

    # The directory where the podspec is
    attr_reader :podspec_dir

    # Flags to pass to the pod definition
    attr_reader :flags

    # Class names of the modules that need to be included in the generated modules provider.
    attr_reader :modules_class_names

    def initialize(json)
      @name = json['packageName']
      @version = json['packageVersion']
      @pod_name = json['podName']
      @podspec_dir = json['podspecDir']
      @flags = json.fetch('flags', {})
      @modules_class_names = json.fetch('modulesClassNames', [])
    end

  end # class Package
end # module Expo
