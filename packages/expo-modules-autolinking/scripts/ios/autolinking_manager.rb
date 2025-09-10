require_relative 'constants'
require_relative 'package'
require_relative 'packages_config'

# Require extensions to CocoaPods' classes
require_relative 'cocoapods/sandbox'
require_relative 'cocoapods/target_definition'
require_relative 'cocoapods/user_project_integrator'
require_relative 'cocoapods/installer'

module Expo
  class AutolinkingManager
    require 'colored2'
    include Pod

    public def initialize(podfile, target_definition, options)
      @podfile = podfile
      @target_definition = target_definition
      @options = options

      validate_target_definition()
      resolve_result = resolve()

      Expo::PackagesConfig.instance.coreFeatures = resolve_result['coreFeatures']

      @packages = resolve_result['modules'].map { |json_package| Package.new(json_package) }
      @extraPods = resolve_result['extraDependencies']
    end

    public def use_expo_modules!
      if has_packages?
        return
      end

      global_flags = @options.fetch(:flags, {})
      tests_only = @options.fetch(:testsOnly, false)
      include_tests = @options.fetch(:includeTests, false)

      # Add any additional framework modules to patch using the patched Podfile class in installer.rb
      additional_framework_modules_to_path = @options.fetch(:additionalFrameworkModulesToPatch, [])
      @podfile.expo_add_modules_to_patch(additional_framework_modules_to_path) if !additional_framework_modules_to_path.empty?

      project_directory = Pod::Config.instance.project_root

      UI.section 'Using Expo modules' do
        @packages.each { |package|
          package.pods.each { |pod|
            # The module can already be added to the target, in which case we can just skip it.
            # This allows us to add a pod before `use_expo_modules` to provide custom flags.
            if @target_definition.dependencies.any? { |dependency| dependency.name == pod.pod_name }
              UI.message '— ' << package.name.green << ' is already added to the target'.yellow
              next
            end

            # Skip if the podspec doesn't include the platform for the current target.
            unless pod.supports_platform?(@target_definition.platform)
              UI.message '- ' << package.name.green << " doesn't support #{@target_definition.platform.string_name} platform".yellow
              next
            end

            # Ensure that the dependencies of packages with Swift code use modular headers, otherwise
            # `pod install` may fail if there is no `use_modular_headers!` declaration or
            # `:modular_headers => true` is not used for this particular dependency.
            # The latter require adding transitive dependencies to user's Podfile that we'd rather like to avoid.
            if package.has_something_to_link?
              use_modular_headers_for_dependencies(pod.spec.all_dependencies)
            end

            podspec_dir_path = Pathname.new(pod.podspec_dir).relative_path_from(project_directory).to_path

            debug_configurations = @target_definition.build_configurations ? @target_definition.build_configurations.select { |config| config.include?('Debug') }.keys : ['Debug']

            pod_options = {
              :path => podspec_dir_path,
              :configuration => package.debugOnly ? debug_configurations : [] # An empty array means all configurations
            }.merge(global_flags, package.flags)

            if tests_only || include_tests
              test_specs_names = pod.spec.test_specs.map { |test_spec|
                test_spec.name.delete_prefix(pod.spec.name + "/")
              }

              # Jump to the next package when it doesn't have any test specs (except interfaces, they're required)
              # TODO: Can remove interface check once we move all the interfaces into the core.
              next if tests_only && test_specs_names.empty? && !pod.pod_name.end_with?('Interface')

              pod_options[:testspecs] = test_specs_names
            end

            # Install the pod.
            @podfile.pod(pod.pod_name, pod_options)

            # TODO: Can remove this once we move all the interfaces into the core.
            next if pod.pod_name.end_with?('Interface')

            UI.message "— #{package.name.green} (#{package.version})"
          }
        }
      end

      @extraPods.each { |pod|
        UI.info "Adding extra pod - #{pod['name']} (#{pod['version'] || '*'})"
        requirements = Array.new
        requirements << pod['version'] if pod['version']
        options = Hash.new
        options[:configurations] = pod['configurations'] if pod['configurations']
        options[:modular_headers] = pod['modular_headers'] if pod['modular_headers']
        options[:source] = pod['source'] if pod['source']
        options[:path] = pod['path'] if pod['path']
        options[:podspec] = pod['podspec'] if pod['podspec']
        options[:testspecs] = pod['testspecs'] if pod['testspecs']
        options[:git] = pod['git'] if pod['git']
        options[:branch] = pod['branch'] if pod['branch']
        options[:tag] = pod['tag'] if pod['tag']
        options[:commit] = pod['commit'] if pod['commit']
        requirements << options
        @podfile.pod(pod['name'], *requirements)
      }
      self
    end

    # Spawns `expo-module-autolinking generate-modules-provider` command.
    public def generate_modules_provider(target_name, target_path)
      Process.wait IO.popen(generate_modules_provider_command_args(target_path)).pid
    end

    # If there is any package to autolink.
    public def has_packages?
      @packages.empty?
    end

    # Filters only these packages that needs to be included in the generated modules provider.
    public def packages_to_generate
      platform = @target_definition.platform

      @packages.select do |package|
        # Check whether the package has any module to autolink
        # and if there is any pod that supports target's platform.
        package.has_something_to_link? && package.pods.any? { |pod| pod.supports_platform?(platform) }
      end
    end

    # Returns the provider name which is also a name of the generated file
    public def modules_provider_name
      @options.fetch(:providerName, Constants::MODULES_PROVIDER_FILE_NAME)
    end

    # Absolute path to `Pods/Target Support Files/<pods target name>/<modules provider file>` within the project path
    public def modules_provider_path(target)
      File.join(target.support_files_dir, modules_provider_name)
    end

    # For now there is no need to generate the modules provider for testing.
    public def should_generate_modules_provider?
      return !@options.fetch(:testsOnly, false)
    end

    # Returns the platform name of the current target definition.
    # Note that it is suitable to be presented to the user (i.e. is not lowercased).
    public def platform_name
      return @target_definition.platform&.string_name
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

    public def base_command_args
      search_paths = @options.fetch(:searchPaths, @options.fetch(:modules_paths, nil))
      ignore_paths = @options.fetch(:ignorePaths, nil)
      exclude = @options.fetch(:exclude, [])
      args = []

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

    private def node_command_args(command_name)
      eval_command_args = [
        'node',
        '--no-warnings',
        '--eval',
        'require(require.resolve(\'expo-modules-autolinking\', { paths: [\'' +  __dir__ + '\'] }))(process.argv.slice(1))',
        command_name,
        '--platform',
        'apple'
      ]
      return eval_command_args.concat(base_command_args())
    end

    private def resolve_command_args
      resolve_command_args = ['--json']

      project_root = @options.fetch(:projectRoot, nil)
      if project_root
        resolve_command_args.concat(['--project-root', project_root])
      end

      node_command_args('resolve').concat(resolve_command_args)
    end

    public def generate_modules_provider_command_args(target_path)
      node_command_args('generate-modules-provider').concat(
        [
          '--target',
          target_path,
          '--packages'
        ],
        packages_to_generate.map(&:name)
      )
    end

    private def use_modular_headers_for_dependencies(dependencies)
      dependencies.each { |dependency|
        # The dependency name might be a subspec like `ReactCommon/turbomodule/core`,
        # but the modular headers need to be enabled for the entire `ReactCommon` spec anyway,
        # so we're stripping the subspec path from the dependency name.
        root_spec_name = dependency.name.partition('/').first

        unless @target_definition.build_pod_as_module?(root_spec_name)
          UI.info "[Expo] ".blue << "Enabling modular headers for pod #{root_spec_name.green}"

          # This is an equivalent to setting `:modular_headers => true` for the specific dependency.
          @target_definition.set_use_modular_headers_for_pod(root_spec_name, true)
        end
      }
    end

    # Validates whether the Expo modules can be autolinked in the given target definition.
    private def validate_target_definition
      # The platform must be declared within the current target (e.g. `platform :ios, '13.0'`)
      if platform_name.nil?
        raise "Undefined platform for target #{@target_definition.name}, make sure to call `platform` method globally or inside the target"
      end

      # The declared platform must be iOS, macOS or tvOS, others are not supported.
      unless ['iOS', 'macOS', 'tvOS'].include?(platform_name)
        raise "Target #{@target_definition.name} is dedicated to #{platform_name} platform, which is not supported by Expo Modules"
      end
    end

  end # class AutolinkingManager
end # module Expo
