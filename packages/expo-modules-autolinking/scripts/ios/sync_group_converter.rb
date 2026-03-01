require 'xcodeproj'
require 'colored2' unless defined?(String.instance_method(:blue))
require 'set'

# The xcodeproj gem doesn't expose a `name` attribute on PBXFileSystemSynchronizedRootGroup,
# but the pbxproj format supports it. Without it, Xcode uses the raw path as the display name.
unless Xcodeproj::Project::Object::PBXFileSystemSynchronizedRootGroup.method_defined?(:name)
  Xcodeproj::Project::Object::PBXFileSystemSynchronizedRootGroup.class_eval do
    attribute :name, String

    def display_name
      return name if name
      return path if path
      super
    end
  end
end

module Expo
  # Converts development pod source groups in Pods.xcodeproj from traditional
  # PBXGroup + PBXFileReference to PBXFileSystemSynchronizedRootGroup.
  #
  # This allows Xcode to auto-discover source files without running `pod install`
  # every time a file is added, renamed, or deleted in a development pod.
  module SyncGroupConverter
    # Converts development pod groups to synchronized root groups in the given pods project.
    #
    # @param [Xcodeproj::Project] pods_project The Pods.xcodeproj to modify.
    # @param [Array<String>, nil] pod_names List of pod names to convert, or nil for all development pods.
    #
    def self.convert_pods_to_sync_groups(pods_project, pod_names: nil)
      project_dir = File.dirname(pods_project.path)

      dev_pods_group = pods_project.main_group.children.find { |g| g.display_name == 'Development Pods' }
      return unless dev_pods_group

      converted = 0

      dev_pods_group.children.to_a.each do |pod_group|
        next unless pod_group.isa == 'PBXGroup'
        next unless pod_group.path && !pod_group.path.empty?
        next if pod_names && !pod_names.include?(pod_group.display_name)

        # Skip pods that have already been converted
        if pod_group.children.any? { |c| c.isa == 'PBXFileSystemSynchronizedRootGroup' }
          next
        end

        if convert_pod_group(pods_project, pod_group, dev_pods_group, project_dir)
          converted += 1
        end
      end

      if converted > 0
        pods_project.save
        log "Converted #{converted} development pod(s) to file system synchronized groups"
      end
    end

    private

    def self.convert_pod_group(project, pod_group, dev_pods_group, project_dir)
      pod_name = pod_group.display_name
      source_path = pod_group.path
      source_tree = pod_group.source_tree

      target = project.native_targets.find { |t| t.name == pod_name }
      unless target
        return false
      end

      # Skip pods that have associated test targets (test specs).
      # Test spec targets create separate Unit-Tests targets that expect source files
      # from the Tests/ directory, which can't be properly split between the main
      # target and test target using a single synchronized root group.
      test_target = project.native_targets.find { |t| t.name == "#{pod_name}-Unit-Tests" }
      if test_target
        log "Skipping #{pod_name}: has a test spec target", :warning
        return false
      end

      # Separate children into source files/groups vs. special groups (Pod, Support Files)
      source_children = []
      special_groups = {}

      pod_group.children.to_a.each do |child|
        if child.isa == 'PBXGroup' && (child.display_name == 'Pod' || child.display_name == 'Support Files')
          special_groups[child.display_name] = child
        else
          source_children << child
        end
      end

      # Collect all PBXFileReferences from the source tree
      source_file_refs = collect_file_refs(source_children)
      source_build_file_uuids = Set.new(source_file_refs.map(&:uuid))

      # Remove source files from build phases (Xcode handles them via the synchronized group)
      target.build_phases.each do |phase|
        phase.files.to_a.each do |build_file|
          if build_file.file_ref && source_build_file_uuids.include?(build_file.file_ref.uuid)
            phase.files.delete(build_file)
            build_file.remove_from_project
          end
        end
      end

      # Remove source file references and subgroups
      source_children.each { |child| remove_recursively(child) }

      # Determine exclusions (e.g. Tests/ directories)
      source_abs_path = File.expand_path(source_path, project_dir)
      exclusions = determine_exclusions(source_abs_path)

      # Create the PBXFileSystemSynchronizedRootGroup
      sync_group = project.new(Xcodeproj::Project::Object::PBXFileSystemSynchronizedRootGroup)
      sync_group.path = source_path
      sync_group.source_tree = source_tree
      sync_group.name = pod_name

      # Create exception set if there are exclusions
      if exclusions.any?
        exception_set = project.new(Xcodeproj::Project::Object::PBXFileSystemSynchronizedBuildFileExceptionSet)
        exception_set.target = target
        exception_set.membership_exceptions = exclusions
        sync_group.exceptions << exception_set
      end

      # Register the synchronized group with the target
      target.file_system_synchronized_groups ||= []
      target.file_system_synchronized_groups << sync_group

      # Fix Support Files path and move it to be a sibling in Development Pods
      support_files = special_groups['Support Files']
      if support_files
        old_support_abs = File.expand_path(support_files.path, source_abs_path)
        new_support_path = Pathname.new(old_support_abs).relative_path_from(Pathname.new(project_dir)).to_s
        support_files.path = new_support_path
        support_files.name = "#{pod_name} Support Files"

        pod_group.children.delete(support_files)
        idx = dev_pods_group.children.index(pod_group)
        dev_pods_group.children.insert(idx + 1, support_files)
      end

      # Remove the Pod subgroup (podspec is visible inside the synced directory)
      special_groups['Pod']&.remove_from_project

      # Replace the old pod_group with the sync group in Development Pods.
      # Note: we can't use `children[idx] =` because ObjectList doesn't track index assignment.
      # And `remove_from_project` on a PBXGroup also removes it from the parent's children,
      # so we need to find the index, remove the old group, then insert the sync group.
      idx = dev_pods_group.children.index(pod_group)
      pod_group.remove_from_project
      dev_pods_group.children.insert(idx, sync_group)

      true
    end

    def self.collect_file_refs(children)
      refs = []
      children.each do |child|
        case child.isa
        when 'PBXFileReference'
          refs << child
        when 'PBXGroup'
          refs.concat(collect_file_refs(child.children.to_a))
        end
      end
      refs
    end

    def self.remove_recursively(node)
      if node.isa == 'PBXGroup'
        node.children.to_a.each { |c| remove_recursively(c) }
      end
      node.remove_from_project
    end

    def self.determine_exclusions(source_abs_path)
      exclusions = []
      ['Tests', 'tests'].each do |dir|
        exclusions << dir if Dir.exist?(File.join(source_abs_path, dir))
      end
      exclusions
    end

    def self.log(message, level = :info)
      if defined?(Pod::UI)
        prefix = level == :warning ? "[Expo] ".yellow : "[Expo] ".blue
        Pod::UI.puts prefix + message
      else
        prefix = level == :warning ? "[Expo] WARNING: " : "[Expo] "
        Kernel.puts prefix + message
      end
    end
  end
end
