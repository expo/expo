require_relative '../project_integrator'

# Unfortunately there is no good and official place that we could use to generate module providers
# and integrate them with user targets by operating on the PBXProj kept and saved by CocoaPods.
# So we have to hook into the private method called `integrate_user_targets`
# where we have public access to everything that we need.
# Original implementation: https://github.com/CocoaPods/CocoaPods/blob/master/lib/cocoapods/installer/user_project_integrator.rb

module Pod
  class Installer
    class UserProjectIntegrator
      include Expo::ProjectIntegrator

      private

      _original_integrate_user_targets = instance_method(:integrate_user_targets)

      # Integrates the targets of the user projects with the libraries
      # generated from the {Podfile}.
      #
      # @note   {TargetDefinition} without dependencies are skipped to prevent
      #         creating empty libraries for target definitions which are only
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
          # and it might be empty subsequent installs after the first install.
          # CocoaPods integrates only these ones.
          projects_to_integrate = user_projects_to_integrate()

          # However, we need to make sure that all projects are integrated,
          # regardless of the CocoaPods cache.
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
