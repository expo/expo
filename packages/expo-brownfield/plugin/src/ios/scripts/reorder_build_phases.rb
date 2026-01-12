require File.join(
  File.dirname(
    `node --print "require.resolve('expo/package.json')"`
  ), 
  "../expo-modules-autolinking/scripts/ios/cocoapods/user_project_integrator.rb"
)

module Pod
  class Installer
    class UserProjectIntegrator
      include Expo::ProjectIntegrator

      private

      _original_integrate_user_targets = instance_method(:integrate_user_targets)

      define_method(:integrate_user_targets) do
        results = _original_integrate_user_targets.bind(self).()

        UI.message '- Ensuring correct order of build phases' do
          all_projects = targets.map { |target| target.user_project }.uniq

          projects_to_integrate = user_projects_to_integrate()

          all_projects.each do |project|
            project_targets = targets.select { |target| target.user_project.equal?(project) }

            targets_with_modules_provider = project_targets.select do |target|
              autolinking_manager = target.target_definition.autolinking_manager
              autolinking_manager.present? && autolinking_manager.should_generate_modules_provider?
            end

            targets_with_modules_provider.each do |target|
              next unless target.target_definition.name == $BROWNFIELD_TARGET_NAME

              target_name = target.target_definition.name
              native_target = project.native_targets.find { |native_target| native_target.name == target_name }
              build_phases = native_target.build_phases

              xcode_build_script = native_target.shell_script_build_phases.find { |script|
                script.name == Expo::Constants::CONFIGURE_PROJECT_BUILD_SCRIPT_NAME
              }

              patch_build_script = native_target.shell_script_build_phases.find { |script|
                script.name == 'Patch ExpoModulesProvider'
              }
              build_phases.delete(patch_build_script)
              
              xcode_build_script_index = build_phases.find_index(xcode_build_script)
              build_phases.insert(xcode_build_script_index + 1, patch_build_script)
            end

            if project.dirty? && !projects_to_integrate.include?(project)
              save_projects([project])
            end
          end
        end

        results
      end
    end # class UserProjectIntegrator
  end # class Installer
end # module Pod
