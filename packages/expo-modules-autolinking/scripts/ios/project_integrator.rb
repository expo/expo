require 'fileutils'
require 'colored2'

module Expo
  module ProjectIntegrator
    include Pod

    CONFIGURATION_FLAG_PREFIX = 'EXPO_CONFIGURATION_'
    SWIFT_FLAGS = 'OTHER_SWIFT_FLAGS'

    # Integrates targets in the project and generates modules providers.
    def self.integrate_targets_in_project(targets, project)
      # Find the targets that use expo modules and need the modules provider
      targets_with_modules_provider = targets.select do |target|
        autolinking_manager = target.target_definition.autolinking_manager
        autolinking_manager.present? && autolinking_manager.should_generate_modules_provider?
      end

      # Find existing PBXGroup for modules providers.
      generated_group = modules_providers_group(project, targets_with_modules_provider.any?)

      # Return early when the modules providers group has not been auto-created in the line above.
      return if generated_group.nil?

      # Remove existing groups for targets without modules provider.
      generated_group.groups.each do |group|
        # Remove the group if there is no target for this group.
        if targets.none? { |target| target.target_definition.name == group.name && targets_with_modules_provider.include?(target) }
          recursively_remove_group(group)
        end
      end

      targets_with_modules_provider.sort_by(&:name).each do |target|
        # The user target name (without `Pods-` prefix which is a part of `target.name`)
        target_name = target.target_definition.name

        # PBXNativeTarget of the user target
        native_target = project.native_targets.find { |native_target| native_target.name == target_name }

        # Shorthand ref for the autolinking manager.
        autolinking_manager = target.target_definition.autolinking_manager

        UI.message '- Generating the provider for ' << target_name.green << ' target' do
          # Get the absolute path to the modules provider
          modules_provider_path = autolinking_manager.modules_provider_path(target)

          # Run `expo-modules-autolinking` command to generate the file
          autolinking_manager.generate_modules_provider(target_name, modules_provider_path)

          # PBXGroup for generated files per target
          generated_target_group = generated_group.find_subpath(target_name, true)

          # PBXGroup uses relative paths, so we need to strip the absolute path
          modules_provider_relative_path = Pathname.new(modules_provider_path).relative_path_from(generated_target_group.real_path).to_s

          if generated_target_group.find_file_by_path(modules_provider_relative_path).nil?
            # Create new PBXFileReference if the modules provider is not in the group yet
            modules_provider_file_reference = generated_target_group.new_file(modules_provider_path)

            if native_target.source_build_phase.files_references.find { |ref| ref.present? && ref.path == modules_provider_relative_path }.nil?
              # Put newly created PBXFileReference to the source files of the native target
              native_target.add_file_references([modules_provider_file_reference])
              project.mark_dirty!
            end
          end
        end

        integrate_build_script(autolinking_manager, project, target, native_target)
      end

      # Remove the generated group if it has nothing left inside
      if targets_with_modules_provider.empty?
        recursively_remove_group(generated_group)
      end
    end

    def self.recursively_remove_group(group)
      return if group.nil?

      UI.message '- Removing ' << group.name.green << ' group' do
        group.recursive_children.each do |child|
          UI.message ' - Removing a reference to ' << child.name.green
          child.remove_from_project
        end

        group.remove_from_project
        group.project.mark_dirty!
      end
    end

    # CocoaPods doesn't properly remove file references from the build phase
    # They appear as nils and it's safe to just delete them from native targets
    def self.remove_nils_from_source_files(project)
      project.native_targets.each do |native_target|
        native_target.source_build_phase.files.each do |build_file|
          next unless build_file.file_ref.nil?

          build_file.remove_from_project
          project.mark_dirty!
        end
      end
    end

    def self.modules_providers_group(project, autocreate = false)
      project.main_group.find_subpath(Constants::GENERATED_GROUP_NAME, autocreate)
    end

    # Sets EXPO_CONFIGURATION_* compiler flag for Swift.
    def self.set_autolinking_configuration(project)
      project.native_targets.each do |native_target|
        native_target.build_configurations.each do |build_configuration|
          configuration_flag = "-D #{CONFIGURATION_FLAG_PREFIX}#{build_configuration.debug? ? "DEBUG" : "RELEASE"}"
          build_settings = build_configuration.build_settings

          # For some targets it might be `nil` by default which is an equivalent to `$(inherited)`
          if build_settings[SWIFT_FLAGS].nil?
            build_settings[SWIFT_FLAGS] ||= '$(inherited)'
          end

          # If the correct flag is not set yet
          if !build_settings[SWIFT_FLAGS].include?(configuration_flag)
            # Remove existing flag to make sure we don't put another one each time
            build_settings[SWIFT_FLAGS] = build_settings[SWIFT_FLAGS].gsub(/\b-D\s+#{Regexp.quote(CONFIGURATION_FLAG_PREFIX)}\w+/, '')

            # Add the correct flag
            build_settings[SWIFT_FLAGS] << ' ' << configuration_flag

            # Make sure the project will be saved as we did some changes
            project.mark_dirty!
          end
        end
      end
    end

    # Makes sure that the build script configuring the project is installed,
    # is up-to-date and is placed before the "Compile Sources" phase.
    def self.integrate_build_script(autolinking_manager, project, target, native_target)
      build_phases = native_target.build_phases
      modules_provider_path = autolinking_manager.modules_provider_path(target)

      # Look for our own build script phase
      xcode_build_script = native_target.shell_script_build_phases.find { |script|
        script.name == Constants::CONFIGURE_PROJECT_BUILD_SCRIPT_NAME
      }

      if xcode_build_script.nil?
        # Inform the user that we added a build script.
        puts "[Expo] ".blue << "Installing the build script for target " << native_target.name.green

        # Create a new build script in the target, it's added as the last phase
        xcode_build_script = native_target.new_shell_script_build_phase(Constants::CONFIGURE_PROJECT_BUILD_SCRIPT_NAME)
      end

      # Make sure it is before the "Compile Sources" build phase
      xcode_build_script_index = build_phases.find_index(xcode_build_script)
      compile_sources_index = build_phases.find_index { |phase|
        phase.is_a?(Xcodeproj::Project::PBXSourcesBuildPhase)
      }

      entitlement_path = nil
      native_target.build_configurations.each do |build_configuration|
        current_entitlement_path = build_configuration.build_settings['CODE_SIGN_ENTITLEMENTS']
        unless current_entitlement_path
          next
        end
        current_entitlement_path = File.join(project.project_dir, current_entitlement_path)
        if !entitlement_path.nil? && entitlement_path != current_entitlement_path
          Pod::UI.warn("Found multiple entitlement files in the build configurations of the target '#{native_target.name}' and using the first matched '#{current_entitlement_path}' for build")
          next
        end
        entitlement_path = current_entitlement_path
      end

      if xcode_build_script_index.nil?
        # This is almost impossible to get here as the script was just created with `new_shell_script_build_phase`
        # that puts the script at the end of the phases, but let's log it just in case.
        puts "[Expo] ".blue << "Unable to find the configuring build script in the Xcode project".red
      end

      if compile_sources_index.nil?
        # In this case the project will probably not compile but that's not our fault
        # and it doesn't block us from updating our build script.
        puts "[Expo] ".blue << "Unable to find the compilation build phase in the Xcode project".red
      end

      # Insert our script before the "Compile Sources" phase when necessary
      unless compile_sources_index.nil? || xcode_build_script_index < compile_sources_index
        build_phases.insert(
          compile_sources_index,
          build_phases.delete_at(xcode_build_script_index)
        )
      end

      # Get path to the script that will be added to the target support files
      support_script_path = File.join(target.support_files_dir, Constants::CONFIGURE_PROJECT_SCRIPT_FILE_NAME)
      support_script_relative_path = Pathname.new(support_script_path).relative_path_from(project.project_dir)

      # Write to the shell script so it's always in-sync with the autolinking configuration
      IO.write(
        support_script_path,
        generate_support_script(autolinking_manager, modules_provider_path, entitlement_path)
      )

      # Make the support script executable
      FileUtils.chmod('+x', support_script_path)

      # Force the build phase script to run on each build (including incremental builds)
      xcode_build_script.always_out_of_date = '1'

      # Make sure the build script in Xcode is up to date, but probably it's not going to change
      # as it just runs the script generated in the target support files
      xcode_build_script.shell_script = generate_xcode_build_script(support_script_relative_path)

      modules_provider_relative_path = Pathname.new(modules_provider_path).relative_path_from(project.project_dir)
      entitlement_relative_path = entitlement_path.nil? ? nil : Pathname.new(entitlement_path).relative_path_from(project.project_dir)

      # Add input and output files to the build script phase to support ENABLE_USER_SCRIPT_SANDBOXING
      xcode_build_script.input_paths = [
        ".xcode.env",
        ".xcode.env.local",
        entitlement_relative_path,
        support_script_relative_path,
      ].compact.map { |path| "$(SRCROOT)/#{path}" }

      xcode_build_script.output_paths = [
        "$(SRCROOT)/#{modules_provider_relative_path}",
      ]
    end

    # Generates the shell script of the build script phase.
    # Try not to modify this since it involves changes in the pbxproj so
    # it's better to modify the support script instead, if possible.
    def self.generate_xcode_build_script(script_relative_path)
      escaped_path = script_relative_path.to_s.gsub(/[^a-zA-Z0-9,\._\+@%\/\-]/) { |char| "\\#{char}" }

      <<~XCODE_BUILD_SCRIPT
      # This script configures Expo modules and generates the modules provider file.
      bash -l -c "./#{escaped_path}"
      XCODE_BUILD_SCRIPT
    end

    # Generates the support script that is executed by the build script phase.
    def self.generate_support_script(autolinking_manager, modules_provider_path, entitlement_path)
      args = autolinking_manager.base_command_args.map { |arg| "\"#{arg}\"" }
      platform = autolinking_manager.platform_name.downcase
      package_names = autolinking_manager.packages_to_generate.map { |package| "\"#{package.name}\"" }
      entitlement_param = entitlement_path.nil? ? '' : "--entitlement \"#{entitlement_path}\""
      app_root_param = autolinking_manager.custom_app_root.nil? ? '' : "--app-root \"#{autolinking_manager.custom_app_root}\""

      <<~SUPPORT_SCRIPT
      #!/usr/bin/env bash
      # @generated by expo-modules-autolinking

      set -eo pipefail

      function with_node() {
        # Start with a default
        export NODE_BINARY=$(command -v node)

        # Override the default with the global environment
        ENV_PATH="$PODS_ROOT/../.xcode.env"
        if [[ -f "$ENV_PATH" ]]; then
          source "$ENV_PATH"
        fi

        # Override the global with the local environment
        LOCAL_ENV_PATH="${ENV_PATH}.local"
        if [[ -f "$LOCAL_ENV_PATH" ]]; then
          source "$LOCAL_ENV_PATH"
        fi

        if [[ -n "$NODE_BINARY" && -x "$NODE_BINARY" ]]; then
          echo "Node found at: ${NODE_BINARY}"
        else
          cat >&2 << NODE_NOT_FOUND
      error: Could not find "node" executable while running an Xcode build script.
      You need to specify the path to your Node.js executable by defining an environment variable named NODE_BINARY in your project's .xcode.env or .xcode.env.local file.
      You can set this up quickly by running:

      echo "export NODE_BINARY=\\$(command -v node)" >> .xcode.env

      in the ios folder of your project.
      NODE_NOT_FOUND

          exit 1
        fi

        # Execute argument, if present
        if [[ "$#" -gt 0 ]]; then
          "$NODE_BINARY" "$@"
        fi
      }

      with_node \\
        --no-warnings \\
        --eval "require(require.resolve(\'expo-modules-autolinking\', { paths: [require.resolve(\'expo/package.json\')] }))(process.argv.slice(1))" \\
        generate-modules-provider #{args.join(' ')} \\
        --target "#{modules_provider_path}" \\
        #{entitlement_param} \\
        #{app_root_param} \\
        --platform "apple" \\
        --packages #{package_names.join(' ')}
      SUPPORT_SCRIPT
    end

  end # module ProjectIntegrator
end # module Expo
