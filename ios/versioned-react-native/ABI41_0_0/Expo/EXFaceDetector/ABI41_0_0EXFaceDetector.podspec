require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ABI41_0_0EXFaceDetector'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '11.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }

  s.dependency 'ABI41_0_0UMCore'
  s.dependency 'ABI41_0_0UMFaceDetectorInterface'
  s.dependency 'ABI41_0_0UMFileSystemInterface'

  # even though `GoogleMLKit/FaceDetection` depends on all `MLKit*` references below
  # framework generation code (prebuilds) cannot locate them properly, so these are defined explicitly
  # TODO: research why xcodegen fails to detect dependencies of dependencies (resulted .xcodeproj is missing them)
  s.dependency 'GoogleMLKit/FaceDetection', '2.1.0'
  s.dependency 'MLKitFaceDetection', '1.2.0'
  s.dependency 'MLKitCommon', '2.1.0'
  s.dependency 'MLKitVision', '1.2.0'

  if !$ExpoUseSources&.include?(package['name']) && ENV['EXPO_USE_SOURCE'].to_i == 0 && File.exist?("#{s.name}.xcframework") && Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.10.0')
    s.source_files = "#{s.name}/**/*.h"
    s.vendored_frameworks = "#{s.name}.xcframework"
  else
    s.source_files = "#{s.name}/**/*.{h,m}"
  end
end
