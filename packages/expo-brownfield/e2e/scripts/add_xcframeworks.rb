require 'xcodeproj'
require 'pathname'
require 'json'

workspace_root = ENV['GITHUB_WORKSPACE']
package_path = File.join(workspace_root, 'artifacts', 'BrownfieldPackage')

# Ensure package exists
unless File.exist?(File.join(package_path, 'Package.swift'))
  puts "Error: BrownfieldPackage not found at #{package_path}"
  exit 1
end

# Read package products from Package.swift
package_info = JSON.parse(`cd #{package_path} && swift package dump-package`)
product_names = package_info['products'].map { |p| p['name'] }
puts "Found package products: #{product_names.join(', ')}"

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

# ── Cleanup ────────────────────────────────────────────────────────────────────

# Remove build files that reference package products
swiftui_target.frameworks_build_phase.files.select { |f|
  f.respond_to?(:product_ref) && !f.product_ref.nil?
}.each(&:remove_from_project)

# Remove all files from frameworks build phase (XCFrameworks)
swiftui_target.frameworks_build_phase.files.each(&:remove_from_project)

# Remove embed frameworks phase
embed_phase = swiftui_target.build_phases.find do |b|
  b.class == Xcodeproj::Project::Object::PBXCopyFilesBuildPhase && b.dst_subfolder_spec == "10"
end
if embed_phase
  embed_phase.files.each(&:remove_from_project)
  embed_phase.remove_from_project
end

# Remove frameworks group
frameworks_group = swiftui_project.main_group['Frameworks']
if frameworks_group
  frameworks_group.files.each(&:remove_from_project)
  frameworks_group.remove_from_project
end

# Remove existing package product dependencies from target
swiftui_target.package_product_dependencies.each(&:remove_from_project)

# Remove existing package references from project (both local and remote)
swiftui_project.root_object.package_references.each(&:remove_from_project)

puts "Cleaned up existing frameworks and packages"

# ── Add Local Swift Package ────────────────────────────────────────────────────

swiftui_project_dir = Pathname.new(File.dirname(swiftui_project_path))
relative_package_path = Pathname.new(package_path).relative_path_from(swiftui_project_dir).to_s

# Add local package reference to project
package_ref = swiftui_project.new(Xcodeproj::Project::Object::XCLocalSwiftPackageReference)
package_ref.relative_path = relative_package_path
swiftui_project.root_object.package_references << package_ref

puts "Added local package reference: #{relative_package_path}"

# Add each product as a dependency on the target
product_names.each do |product_name|
  package_product = swiftui_project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
  package_product.package = package_ref
  package_product.product_name = product_name
  swiftui_target.package_product_dependencies << package_product

  build_file = swiftui_project.new(Xcodeproj::Project::Object::PBXBuildFile)
  build_file.product_ref = package_product
  swiftui_target.frameworks_build_phase.files << build_file

  puts "Added product '#{product_name}' to #{swiftui_target_name}"
end

swiftui_project.save
puts "Project saved successfully"
