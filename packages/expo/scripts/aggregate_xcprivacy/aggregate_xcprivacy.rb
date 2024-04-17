require_relative './plist/lib/plist'

def get_used_required_reason_apis(installer)
  # A dictionary with keys of type string (NSPrivacyAccessedAPIType) and values of type string[] (NSPrivacyAccessedAPITypeReasons[])
  used_apis = {}
  puts "Reading xcprivacy files to aggregate all used Required Reason APIs."
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
              used_apis[api_type] ||= []
              used_apis[api_type] += reasons
            end
          end
        end
      end
    end
  end
  return used_apis
end

def get_privacyinfo_file_path(target)
  # We find a file we know exists in the project to get the path to the main group directory
  app_delegate_path = target.source_build_phase.files_references.find { |file_ref| file_ref.name == "AppDelegate.mm" }
  destination_path = "#{File.dirname(app_delegate_path.real_path)}/PrivacyInfo.xcprivacy"
  return destination_path
end

def read_privacyinfo_file(file_path)
  # Maybe add missing default NSPrivacyTracking, NSPrivacyTrackingDomains, NSPrivacyCollectedDataTypes, but this works without those keys
  source_data = nil
  # Try to read an exisitng PrivacyInfo.xcprivacy file
  begin
    source_data = Plist.parse_xml(file_path)
    puts "Appending aggregated reasons to existing PrivacyInfo.xcprivacy file."
  rescue => e
    puts "No existing PrivacyInfo.xcprivacy file found, creating a new one."
  end
  return source_data
end

def ensure_reference(file_path, target)
  reference_exists = target.resources_build_phase.files_references.any? { |file_ref| file_ref.name == "PrivacyInfo.xcprivacy" }
  unless reference_exists
    file_ref = project.new_file(file_path)
    build_file = resources_build_phase.add_file_reference(file_ref, true)
  end
end

def aggregate_xcprivacy!(installer)
  # Get all required reason APIs defined in current pods
  required_reason_apis = get_used_required_reason_apis(installer)

  # Get a reference to the Xcode project
  project = installer.aggregate_targets.first.user_project
  # Assuming target is first for react_native projects
  target = project.targets.first

  file_path = get_privacyinfo_file_path(target)

  existing_privacy_info_file = read_privacyinfo_file(file_path) || {}

  (existing_privacy_info_file["NSPrivacyAccessedAPITypes"] || []).each do |accessed_api|
    api_type = accessed_api["NSPrivacyAccessedAPIType"]
    reasons = accessed_api["NSPrivacyAccessedAPITypeReasons"]
    # Add reasons from existing PrivacyInfo file to the ones from pods
    required_reason_apis[api_type] ||= []
    required_reason_apis[api_type] += reasons
  end

  # Update the existing PrivacyInfo file with the new aggregated data
  existing_privacy_info_file["NSPrivacyAccessedAPITypes"] = required_reason_apis.map { |api_type, reasons|
    {
      "NSPrivacyAccessedAPIType" => api_type,
      "NSPrivacyAccessedAPITypeReasons" => reasons.uniq
    }
  }
  
  File.open(file_path, "w") do |file|
    file.write(Plist::Emit.dump(existing_privacy_info_file))
  end

  ensure_reference(file_path, target)
end
