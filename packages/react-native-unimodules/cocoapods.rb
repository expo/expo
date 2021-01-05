require 'json'
require 'pathname'
require 'open3'
require 'optparse'

def use_unimodules!(custom_options = {})
  root_package_json = JSON.parse(File.read(find_project_package_json_path))
  json_options = root_package_json.fetch('react-native-unimodules', {}).fetch('ios', {}).transform_keys(&:to_sym)

  options = {
    modules_paths: ['../node_modules'],
    target: 'react-native',
    exclude: [],
    flags: {}
  }.deep_merge(json_options).deep_merge(custom_options)

  modules_paths = options.fetch(:modules_paths)
  modules_to_exclude = options.fetch(:exclude)
  target = options.fetch(:target)
  flags = options.fetch(:flags)

  unimodules = {}
  unimodules_duplicates = []

  project_directory = Pod::Config.instance.project_root

  modules_paths.each do |module_path|
    canonical_module_path = Pathname.new(File.join(project_directory, module_path)).cleanpath
    glob_pattern = File.join(canonical_module_path, '**/*/**', 'unimodule.json')

    Dir.glob(glob_pattern) do |module_config_path|
      unimodule_json = JSON.parse(File.read(module_config_path))
      directory = File.dirname(module_config_path)
      platforms = unimodule_json['platforms'] || ['ios']
      targets = unimodule_json['targets'] || ['react-native']

      if unimodule_supports_platform(platforms, 'ios') && unimodule_supports_target(targets, target)
        package_json_path = File.join(directory, 'package.json')
        package_json = JSON.parse(File.read(package_json_path))
        package_name = unimodule_json['name'] || package_json['name']

        unless modules_to_exclude.include?(package_name)
          unimodule_config = { 'subdirectory' => 'ios' }.merge(unimodule_json.fetch('ios', {}))
          unimodule_version = package_json['version']

          unimodules_duplicates.push(package_name) if unimodules[package_name]

          if !unimodules[package_name] || Gem::Version.new(unimodule_version) >= Gem::Version.new(unimodules[package_name][:version])
            unimodules[package_name] = {
              name: package_name,
              directory: directory,
              version: unimodule_version,
              config: unimodule_config,
              warned: false
            }
          end
        end
      end
    end
  end

  if unimodules.values.length > 0
    puts brown 'Installing unimodules:'

    unimodules.values.sort! { |x, y| x[:name] <=> y[:name] }.each do |unimodule|
      directory = unimodule[:directory]
      config = unimodule[:config]

      subdirectory = config['subdirectory']
      pod_name = config.fetch('podName', find_pod_name(directory, subdirectory))
      podspec_directory = Pathname.new("#{directory}/#{subdirectory}").relative_path_from(project_directory)

      puts " #{green unimodule[:name]}#{cyan '@'}#{magenta unimodule[:version]} from #{blue podspec_directory}"

      pod_options = flags.merge({ path: podspec_directory.to_s })

      pod pod_name.to_s, pod_options
    end

    if unimodules_duplicates.length > 0
      puts
      puts brown 'Found some duplicated unimodule packages. Installed the ones with the highest version number.'
      puts brown 'Make sure following dependencies of your project are resolving to one specific version:'

      puts ' ' + unimodules_duplicates
                 .uniq
                 .map { |package_name| green(package_name) }
                 .join(', ')
    end
  else
    puts
    puts brown "No unimodules found. Are you sure you've installed JS dependencies before installing pods?"
  end

  puts
end

def find_project_package_json_path
  stdout, _stderr, _status = Open3.capture3('node -e "const findUp = require(\'find-up\'); console.log(findUp.sync(\'package.json\'));"')
  stdout.strip!
end

def find_pod_name(package_path, subdirectory)
  podspec_path = Dir.glob(File.join(package_path, subdirectory, '*.podspec')).first
  podspec_path && File.basename(podspec_path).chomp('.podspec')
end

def unimodule_supports_platform(platforms, platform)
  platforms.class == Array && platforms.include?(platform)
end

def unimodule_supports_target(targets, target)
  targets.class == Array && targets.include?(target)
end

def green(message)
  "\e[32m#{message}\e[0m"
end

def brown(message)
  "\e[33m#{message}\e[0m"
end

def blue(message)
  "\e[34m#{message}\e[0m"
end

def magenta(message)
  "\e[35m#{message}\e[0m"
end

def cyan(message)
  "\e[36m#{message}\e[0m"
end
