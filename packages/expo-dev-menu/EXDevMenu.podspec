require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'EXDevMenu'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '11.0'
  s.swift_version  = '5.2'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.source_files   = 'ios/**/*.{h,m,swift}', 'vendored/**/*.{h,m}'
  s.preserve_paths = 'ios/**/*.{h,m,swift}'
  s.requires_arc   = true

  s.resource_bundles = { 'EXDevMenu' => [
    'assets/*.ios.js',
    'assets/dev-menu-packager-host',
    'assets/*.ttf'
  ]}

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = { "DEFINES_MODULE" => "YES" }
  # s.script_phase = {
  #   :name => 'Copy Swift Header',
  #   :script => 'ditto "${BUILT_PRODUCTS_DIR}/Swift Compatibility Header/${PRODUCT_MODULE_NAME}-Swift.h" "${PODS_ROOT}/Headers/Public/${PRODUCT_MODULE_NAME}/${PRODUCT_MODULE_NAME}-Swift.h"',
  #   :execution_position => :after_compile,
  #   :input_files => ['${BUILT_PRODUCTS_DIR}/Swift Compatibility Header/${PRODUCT_MODULE_NAME}-Swift.h']
  # }

  s.dependency 'React'
  s.dependency 'EXDevMenuInterface'
end
