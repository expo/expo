require_relative 'constants'
require_relative 'package'

# Require extensions to CocoaPods' classes
require_relative 'cocoapods/pod_target'
require_relative 'cocoapods/target_definition'
require_relative 'cocoapods/user_project_integrator'

module Expo
  class AutolinkingManager
    require 'colored2'
    include Pod

    public def initialize(podfile, target_definition, options)
      @podfile = podfile
      @target_definition = target_definition
      @options = options
      @packages = resolve()['modules'].map { |json_package| Package.new(json_package) }
    end

    public def use_expo_modules!
      if has_packages?
        return
      end

      global_flags = @options.fetch(:flags, {})
      tests = @options.fetch(:tests, [])

      project_directory = Pod::Config.instance.project_root

      UI.section 'Using Expo modules' do
        @packages.each { |package|
          # The module can already be added to the target, in which case we can just skip it.
          # This allows us to add a pod before `use_expo_modules` to provide custom flags.
          if @target_definition.dependencies.any? { |dependency| dependency.name == package.pod_name }
            UI.message '— ' << package.name.green << ' is already added to the target'.yellow
            next
          end

          podspec_dir_path = Pathname.new(package.podspec_dir).relative_path_from(project_directory).to_path

          pod_options = {
            :path => podspec_dir_path,
            :testspecs => tests.include?(package.name) ? ['Tests'] : []
          }.merge(global_flags, package.flags)

          # Install the pod.
          @podfile.pod(package.pod_name, pod_options)

          # TODO: Can remove this once we move all the interfaces into the core.
          next if package.pod_name.end_with?('Interface')

          UI.message "— #{package.name.green} (#{package.version})"
        }
      end
      self
    end

    # Spawns `expo-module-autolinking generate-package-list` command.
    public def generate_package_list(target_name, target_path)
      Process.wait IO.popen(generate_package_list_command_args(target_path)).pid
    end

    # If there is any package to autolink.
    public def has_packages?
      @packages.empty?
    end

    # Filters only these packages that needs to be included in the generated modules provider.
    public def packages_to_generate
      @packages.select { |package| package.modules_class_names.any? }
    end

    # Returns the provider name which is also a name of the generated file
    public def modules_provider_name
      @options.fetch(:providerName, Constants::MODULES_PROVIDER_FILE_NAME)
    end

    # privates

    private def resolve
      json = []

      IO.popen(resolve_command_args) do |data|
        while line = data.gets
          json << line
        end
      end

      begin
        JSON.parse(json.join())
      rescue => error
        raise "Couldn't parse JSON coming from `expo-modules-autolinking` command:\n#{error}"
      end
    end

    private def node_command_args(command_name)
      search_paths = @options.fetch(:searchPaths, @options.fetch(:modules_paths, nil))
      ignore_paths = @options.fetch(:ignorePaths, nil)
      exclude = @options.fetch(:exclude, [])

      args = [
        'node',
        '--eval',
        'require(\'expo-modules-autolinking\')(process.argv.slice(1))',
        command_name,
        '--platform',
        'ios'
      ]

      if !search_paths.nil? && !search_paths.empty?
        args.concat(search_paths)
      end

      if !ignore_paths.nil? && !ignore_paths.empty?
        args.concat(['--ignore-paths'], ignore_paths)
      end

      if !exclude.nil? && !exclude.empty?
        args.concat(['--exclude'], exclude)
      end

      args
    end

    private def resolve_command_args
      node_command_args('resolve').concat(['--json'])
    end

    private def generate_package_list_command_args(target_path)
      node_command_args('generate-package-list').concat([
        '--target',
        target_path
      ])
    end

  end # class AutolinkingManager
end # module Expo
