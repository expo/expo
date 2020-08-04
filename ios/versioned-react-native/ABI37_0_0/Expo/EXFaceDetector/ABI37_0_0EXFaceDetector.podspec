require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ABI37_0_0EXFaceDetector'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '10.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.source_files   = 'ABI37_0_0EXFaceDetector/**/*.{h,m}'
  s.preserve_paths = 'ABI37_0_0EXFaceDetector/**/*.{h,m}'
  s.requires_arc   = true

  s.dependency 'ABI37_0_0UMCore'
  s.dependency 'ABI37_0_0UMFaceDetectorInterface'
  s.dependency 'Firebase/Core', "6.14.0"
  s.dependency 'Firebase/MLVision', "6.14.0"
  s.dependency 'Firebase/MLVisionFaceModel', "6.14.0"
  s.dependency 'FirebaseMLVision', "0.19.0"
  s.dependency 'FirebaseMLCommon', "0.19.0"
end
