require 'xcodeproj'
require 'pathname'

workspace_root = ENV['GITHUB_WORKSPACE']
frameworks_path = File.join(workspace_root, 'artifacts')

# Ensure all needed frameworks exist
frameworks = ["expoappbrownfield.xcframework", "hermesvm.xcframework"]
for framework in frameworks do
  framework_path = File.join(frameworks_path, framework)
  unless File.exist?(framework_path)
    puts "Error: #{framework} XCFramework not found at #{framework_path}"
    exit 1
  end
end

# Modify SwiftUI project
swiftui_target_name = "BrownfieldIntegratedTester"
swiftui_project_path = File.join(
  workspace_root, 
  'apps', 
  'brownfield-tester', 
  'ios-integrated',
  "#{swiftui_target_name}.xcodeproj"
)

swiftui_project = Xcodeproj::Project.open(swiftui_project_path)
swiftui_target = swiftui_project.targets.find { |t| t.name == swiftui_target_name }
raise "Target #{swiftui_target_name} not found" unless swiftui_target

swiftui_project_dir = Pathname.new(File.dirname(swiftui_project_path))
swiftui_frameworks_group = swiftui_project.main_group['Frameworks'] || swiftui_project.new_group('Frameworks')

embed_phase = swiftui_target.build_phases.find do |b| 
  b.class == Xcodeproj::Project::Object::PBXCopyFilesBuildPhase && b.dst_subfolder_spec == "10" 
end
if embed_phase.nil?
  embed_phase = swiftui_target.new_copy_files_build_phase("Embed Frameworks")
  embed_phase.dst_subfolder_spec = "10"
end

frameworks.each do |framework|
  framework_path = Pathname.new(File.join(frameworks_path, framework))
  relative_framework_path = framework_path.relative_path_from(swiftui_project_dir).to_s
  framework_ref = swiftui_frameworks_group.files.find { |f| f.path == relative_framework_path } || 
    swiftui_frameworks_group.new_file(relative_framework_path)

  swiftui_target.frameworks_build_phase.add_file_reference(framework_ref)

  build_file = embed_phase.add_file_reference(framework_ref)
  build_file.settings = { 'ATTRIBUTES' => ['CodeSignOnCopy', 'RemoveHeadersOnCopy'] }

  puts "Added #{relative_framework_path} to #{swiftui_target_name}"
end

swiftui_project.save
