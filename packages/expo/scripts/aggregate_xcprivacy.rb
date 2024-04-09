require 'plist'

def aggregate_xcprivacy!(installer)
  mapping = {}

  puts "Reading xcprivacy files to aggregate all used Required Reason APIs."
  # We should be able to assume that each aggregate target has only one user project
  project = installer.aggregate_targets.first.user_project
  installer.pod_targets.each do |pod_target|
    pod_target.file_accessors.each do |file_accessor|
      file_accessor.resource_bundles.each do |bundle_name, bundle_files|
        bundle_files.each do |file_path|
          # This needs to be named like that due to apple requirements
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
  # Assuming target is first for react_native projects
  target = project.targets.first

  resources_build_phase = target.resources_build_phase
  source_build_phase = target.source_build_phase

  # We find a file we know exists in the project to get the path to the main group directory
  app_delegate_path = source_build_phase.files_references.find { |file_ref| file_ref.name == "AppDelegate.mm" }
  destination_path = "#{File.dirname(app_delegate_path.real_path)}/PrivacyInfo.xcprivacy"

  # Maybe add missing default NSPrivacyTracking, NSPrivacyTrackingDomains, NSPrivacyCollectedDataTypes, but this works without those keys
  source_data = {}

  # Try to read an exisitng PrivacyInfo.xcprivacy file
  begin
    source_data = Plist.parse_xml(destination_path)
    puts "Appending aggregated reasons to existing PrivacyInfo.xcprivacy file."

    # add existing, parsed reasons to aggregated mapping
    source_data["NSPrivacyAccessedAPITypes"] ||= []
    source_data["NSPrivacyAccessedAPITypes"].each do |accessed_api|
      api_type = accessed_api["NSPrivacyAccessedAPIType"]
      reasons = accessed_api["NSPrivacyAccessedAPITypeReasons"]
      mapping[api_type] ||= []
      mapping[api_type] += reasons
    end
  rescue => e
    puts "No existing PrivacyInfo.xcprivacy file found, creating a new one."
  end

  source_data["NSPrivacyAccessedAPITypes"] = mapping.map { |api_type, reasons|
    {
      "NSPrivacyAccessedAPIType" => api_type,
      "NSPrivacyAccessedAPITypeReasons" => reasons.uniq
    }
  }

  File.open(destination_path, "w") do |file|
    file.write(Plist::Emit.dump(source_data))
  end

  reference_exists = resources_build_phase.files_references.any? { |file_ref| file_ref.name == "PrivacyInfo.xcprivacy" }
  unless reference_exists
    file_ref = project.new_file(destination_path)
    build_file = resources_build_phase.add_file_reference(file_ref, true)
  end
end
