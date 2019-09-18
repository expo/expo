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
  s.platform       = :ios, '10.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.source_files   = 'EXFaceDetector/**/*.{h,m}'
  s.preserve_paths = 'EXFaceDetector/**/*.{h,m}'
  s.requires_arc   = true

  s.dependency 'UMCore'
  s.dependency 'UMFaceDetectorInterface'
  s.dependency 'Firebase/Core', "~> 6.2.1"
  s.dependency 'Firebase/MLVision', "~> 0.17.0"
  s.dependency 'Firebase/MLVisionFaceModel', "~> 0.17.0"

end

  
