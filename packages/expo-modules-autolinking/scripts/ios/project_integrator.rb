
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
        autolinking_manager.present?
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

        UI.message '- Generating the provider for ' << target_name.green << ' target' do
          # PBXNativeTarget of the user target
          native_target = project.native_targets.find { |native_target| native_target.name == target_name }

          # Shorthand ref for the autolinking manager.
          autolinking_manager = target.target_definition.autolinking_manager

          # Absolute path to `Pods/Target Support Files/<pods target name>/<modules provider file>` within the project path
          modules_provider_path = File.join(target.support_files_dir, autolinking_manager.modules_provider_name)

          # Run `expo-modules-autolinking` command to generate the file
          autolinking_manager.generate_package_list(target_name, modules_provider_path)

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

  end # module ExpoAutolinkingExtension
end # module Expo
