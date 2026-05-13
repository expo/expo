require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoCameraBarcodeScanning'
  s.version        = package['version']
  s.summary        = 'ZXing-based barcode scanning provider for expo-camera'
  s.description    = 'Provides PDF417, Code39, and Codabar barcode scanning via ZXingObjC for expo-camera'
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { :git => 'https://github.com/expo/expo.git' }
  s.static_framework = true

  s.dependency 'ExpoCamera'
  s.dependency 'ZXingObjC/PDF417'
  s.dependency 'ZXingObjC/OneD'

  s.source_files = 'barcode-scanning/**/*.swift'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'GCC_PREPROCESSOR_DEFINITIONS' => 'ZXINGOBJC_USE_SUBSPECS ZXINGOBJC_PDF417 ZXINGOBJC_ONED',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
