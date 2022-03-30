# Copyright 2018-present 650 Industries. All rights reserved.

module Expo
  class ReactImportPatcher

    public def initialize(installer, options)
      @root = installer.sandbox.root
      @module_dirs = get_module_dirs(installer)
      @options = options
    end

    public def run!
      args = [
        'node',
        '--eval',
        'require(\'expo-modules-autolinking\')(process.argv.slice(1))',
        'patch-react-imports',
        '--pods-root',
        File.expand_path(@root),
      ]

      if @options[:dry_run]
        args.append('--dry-run')
      end

      @module_dirs.each do |dir|
        args.append(File.expand_path(dir))
      end
      Pod::UI.message "Executing ReactImportsPatcher node command: #{Shellwords.join(args)}"

      time_begin = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      system(*args)
      elapsed_time = Process.clock_gettime(Process::CLOCK_MONOTONIC) - time_begin
      Pod::UI.info "expo_patch_react_imports! took #{elapsed_time.round(4)} seconds to transform files."
    end

    private def get_module_dirs(installer)
      unless installer.pods_project
        Pod::UI.message '`pods_project` not found. This is expected when `:incremental_installation` is enabled in your project\'s Podfile.'
        return []
      end

      result = []
      installer.pods_project.development_pods.children.each do |pod|
        if pod.is_a?(Xcodeproj::Project::Object::PBXFileReference) && pod.path.end_with?('.xcodeproj')
          # Support generate_multiple_pod_projects or use_frameworks!
          project = Xcodeproj::Project.open(File.join(installer.sandbox.root, pod.path))
          groups = project.groups.select { |group| !(['Dependencies', 'Frameworks', 'Products'].include? group.name) }
          groups.each do |group|
            result.append(group.real_path.to_s)
          end
        else
          result.append(pod.real_path.to_s)
        end
      end

      return result.select { |dir|
        # Exclude known dirs unnecessary to patch and reduce processing time
        !dir.include?('/react-native/') &&
        !dir.end_with?('/react-native') &&
        !dir.include?('/expo-')
      }
    end

  end # class ReactImportPatcher
end # module Expo
