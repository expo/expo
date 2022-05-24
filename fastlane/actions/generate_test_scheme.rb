require 'xcodeproj'

module Fastlane
  module Actions
    module SharedValues
      GENERATE_TEST_SCHEME_CUSTOM_VALUE = :GENERATE_TEST_SCHEME_CUSTOM_VALUE
    end

    class GenerateTestSchemeAction < Action
      def self.run(params)
        scheme_name = params[:scheme_name]
        generated_scheme_name = "#{scheme_name}_generated"
        
        workspace_path = params[:workspace_path]
        workspace = Xcodeproj::Workspace.new_from_xcworkspace(workspace_path)

        targets_to_test = params[:targets]&.select { |target| !target.empty? } || []

        # TODO: Check if scheme exists and if the scheme is shared
        scheme_project_path = workspace.schemes.find { |k, v| k == scheme_name }.last
        main_project = Xcodeproj::Project.open(scheme_project_path)
        scheme = Xcodeproj::XCScheme.new(File.join(main_project.path, 'xcshareddata', 'xcschemes', "#{scheme_name}.xcscheme"))
        UI.message "Found scheme '#{scheme_name}' in project '#{main_project.path}'"

        # TODO: Check if path exists
        pods_project_path = workspace.schemes.find { |k, v| v.include?('Pods.xcodeproj') }.last
        pods_project = Xcodeproj::Project.open(pods_project_path)
        UI.message "Found pods project: '#{pods_project.path}'"

        UI.message "Finding test targets in the Pods project..."
        testables = pods_project.native_targets.select { |target|
          target.test_target_type? == true && (targets_to_test.empty? || targets_to_test.include?(target.name))
        }.map { |target|
          UI.message "  - #{target.name}"
          Xcodeproj::XCScheme::TestAction::TestableReference.new(target, main_project)
        }

        if testables.empty?
          UI.user_error! "No test targets found in the Pods project"
        end

        scheme.test_action.testables = testables
        scheme.save_as(scheme_project_path, generated_scheme_name)
        UI.message "Saved generated scheme '#{generated_scheme_name}' to project '#{scheme_project_path}'"

        generated_scheme_name
      end

      #####################################################
      # @!group Documentation
      #####################################################

      def self.description
        "Generate a scheme containing all test targets from pods"
      end

      def self.details
        "Creates a scheme aggegating all test targets from pod projects in given workspace.\nGenerated scheme is based on template scheme given as parameter."
      end

      def self.available_options
        [
          FastlaneCore::ConfigItem.new(key: :scheme_name,
                                       description: "Initial scheme name for GenerateTestSchemeAction", # a short description of this parameter
                                       verify_block: proc do |value|
                                          UI.user_error!("No scheme for GenerateTestSchemeAction given, pass using `scheme_name: 'MyScheme'`") unless (value and not value.empty?)
                                       end),
          FastlaneCore::ConfigItem.new(key: :workspace_path,
                                       description: "Path to workspace file", # a short description of this parameter
                                       verify_block: proc do |value|
                                          UI.user_error!("No workspace path given, pass using `workspace_path: 'path/to/file.xcworkspace'`") unless (value and not value.empty?)
                                          UI.user_error!("Couldn't find workspace file at path '#{value}'") unless File.exist?(value)
                                       end),
          FastlaneCore::ConfigItem.new(key: :targets,
                                       description: "List of targets to test. If not specified, all packages in the workspace will be tested",
                                       is_string: false,
                                       type: Array,
                                       optional: true)
        ]
      end

      def self.return_value
        # If your method provides a return value, you can describe here what it does
        "Generated scheme name"
      end

      def self.is_supported?(platform)
        platform == :ios
      end

      private

      def self.construct_referenced_container_uri(target, root_project = nil)
        target_project = target.project
        root_project ||= target_project
        root_project_dir_path = root_project.root_object.project_dir_path
        path = if !root_project_dir_path.to_s.empty?
                 root_project.path + root_project_dir_path
               else
                 root_project.project_dir
               end
        relative_path = target_project.path.relative_path_from(path).to_s
        relative_path = target_project.path.basename if relative_path == '.'
        "container:#{relative_path}"
      end
    end
  end
end
