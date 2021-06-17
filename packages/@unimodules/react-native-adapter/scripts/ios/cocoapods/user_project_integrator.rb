require_relative '../project_integrator'

module Pod
  class Installer
    class UserProjectIntegrator
      include Expo::ProjectIntegrator

      private

      _original_integrate_user_targets = instance_method(:integrate_user_targets)

      # Integrates the targets of the user projects with the libraries
      # generated from the {Podfile}.
      #
      # @note   {TargetDefinition} without dependencies are skipped prevent
      #         creating empty libraries for targets definitions which are only
      #         wrappers for others.
      #
      # @return [void]
      #
      define_method(:integrate_user_targets) do
        # Call original method first
        results = _original_integrate_user_targets.bind(self).()

        UI.message '- Integrating Expo modules providers' do
          # All user targets mapped to user projects.
          all_projects = targets.map { |target| target.user_project }.uniq

          # Array of projects to integrate is usually a subset of `all_projects`,
          # especially it might be empty after subsequent installations.
          # CocoaPods integrates only these ones.
          projects_to_integrate = user_projects_to_integrate()

          # However, we need to make sure that all projects are integrated,
          # no matter of the CocoaPods cache.
          all_projects.each do |project|
            project_targets = targets.select { |target| target.user_project.equal?(project) }

            Expo::ProjectIntegrator::integrate_targets_in_project(project_targets, project)
            Expo::ProjectIntegrator::remove_nils_from_source_files(project)

            # CocoaPods saves the projects to integrate at the next step,
            # but in some cases we're modifying other projects as well.
            # Below we make sure the project will be saved and no more than once!
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
