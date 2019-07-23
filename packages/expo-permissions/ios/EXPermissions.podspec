require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name            = 'EXPermissions'
  s.version         = package['version']
  s.summary         = package['description']
  s.description     = package['description']
  s.license         = package['license']
  s.author          = package['author']
  s.homepage        = package['homepage']
  s.platform        = :ios, '10.0'
  s.source          = { git: 'https://github.com/expo/expo.git' }

  s.requires_arc    = true

  s.default_subspec = "All"

 s.subspec "Core" do |ss|
    s.dependency 'UMCore'
    s.dependency 'UMPermissionsInterface'
    ss.source_files = "EXPermissions/*.{h,m}"
  end

 s.subspec "AudioRecording" do |ss|
    ss.dependency "EXPermissions/Core"
    ss.source_files = "EXPermissions/Requesters/AudioRecording/*.{h,m}"
  end
 
 s.subspec "Brightness" do |ss|
    ss.dependency "EXPermissions/Core"
    ss.source_files = "EXPermissions/Requesters/Brightness/*.{h,m}"
  end
 
  s.subspec "Calendar" do |ss|
    ss.dependency "EXPermissions/Core"
    ss.source_files = "EXPermissions/Requesters/Calendar/*.{h,m}"
  end

  s.subspec "Camera" do |ss|
    ss.dependency "EXPermissions/Core"
    ss.source_files = "EXPermissions/Requesters/Camera/*.{h,m}"
  end

  s.subspec "CameraRoll" do |ss|
    ss.dependency "EXPermissions/Core"
    ss.source_files = "EXPermissions/Requesters/CameraRoll/*.{h,m}"
  end
 
  s.subspec "Contacts" do |ss|
    ss.dependency "EXPermissions/Core"
    ss.source_files = "EXPermissions/Requesters/Contacts/*.{h,m}"
  end

  s.subspec "Location" do |ss|
    ss.dependency "EXPermissions/Core"
    ss.source_files = "EXPermissions/Requesters/Location/*.{h,m}"
  end

  s.subspec "Reminders" do |ss|
    ss.dependency "EXPermissions/Core"
    ss.source_files = "EXPermissions/Requesters/Reminders/*.{h,m}"
  end

  s.subspec "RemoteNotification" do |ss|
    ss.dependency "EXPermissions/Core"
    ss.source_files = "EXPermissions/Requesters/RemoteNotification/*.{h,m}"
  end

  s.subspec "UserNotification" do |ss|
    ss.dependency "EXPermissions/Core"
    ss.source_files = "EXPermissions/Requesters/UserNotification/*.{h,m}"
  end
  
  s.subspec "All" do |ss|
    ss.dependency "EXPermissions/Core"
    ss.dependency "EXPermissions/AudioRecording"
    ss.dependency "EXPermissions/Brightness"
    ss.dependency "EXPermissions/Calendar"
    ss.dependency "EXPermissions/Camera"
    ss.dependency "EXPermissions/CameraRoll"
    ss.dependency "EXPermissions/Contacts"
    ss.dependency "EXPermissions/Location"
    ss.dependency "EXPermissions/Reminders"
    ss.dependency "EXPermissions/RemoteNotification"
    ss.dependency "EXPermissions/UserNotification"
  end
end
