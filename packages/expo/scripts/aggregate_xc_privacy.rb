require 'plist'

def aggregate_xc_privacy!(installer)
  mapping = {}
  project = installer.aggregate_targets.first.user_project
  installer.pod_targets.each do |pod_target|
    pod_target.file_accessors.each do |file_accessor|
      file_accessor.resource_bundles.each do |bundle_name, bundle_files|
        bundle_files.each do |file_path|
          if File.basename(file_path) == 'PrivacyInfo.xcprivacy'
            content = Plist.parse_xml(file_path)
            accessed_api_types = content["NSPrivacyAccessedAPITypes"]
            accessed_api_types.each do |accessed_api|
              api_type = accessed_api["NSPrivacyAccessedAPIType"]
              reasons = accessed_api["NSPrivacyAccessedAPITypeReasons"]
              
              mapping[api_type] ||= []
              mapping[api_type] += reasons
            end
          end
      
        end
      end
    end
  end

  # Get a reference to the Xcode project
  project = installer.aggregate_targets.first.user_project
  destination_path = "#{project.path}/PrivacyInfo.xcprivacy"
  formatted_data = {
  "NSPrivacyAccessedAPITypes" => mapping.map { |api_type, reasons| { "NSPrivacyAccessedAPIType" => api_type, "NSPrivacyAccessedAPITypeReasons" => reasons.uniq } }
  }
  File.open(destination_path, "w") do |file|
    file.write(Plist::Emit.dump(formatted_data))
  end

  # Assuming target is first for react-native projects
  target = project.targets.first

  build_phase = target.resources_build_phase

  file_exists = build_phase.files_references.any? { |file_ref|  file_ref.name == "PrivacyInfo.xcprivacy" }

  unless file_exists
    file_ref = project.new_file(destination_path)
    build_file = build_phase.add_file_reference(file_ref, true)
  end
end
