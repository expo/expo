require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'EXFaceDetector'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '9.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.source_files   = 'EXFaceDetector/**/*.{h,m}'
  s.preserve_paths = 'EXFaceDetector/**/*.{h,m}'
  s.requires_arc   = true

  s.dependency 'EXCore'
  s.dependency 'EXFaceDetectorInterface'
  s.dependency 'GoogleMobileVision/FaceDetector', '~> 1.1.0'
  s.dependency 'GoogleMobileVision/MVDataOutput', '~> 1.1.0'

end

  