require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'EXUpdatesInterface'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '13.0'
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.source_files = 'EXUpdatesInterface/**/*.{h,m,swift}'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'GCC_TREAT_INCOMPATIBLE_POINTER_TYPE_WARNINGS_AS_ERRORS' => 'YES',
    'GCC_TREAT_IMPLICIT_FUNCTION_DECLARATIONS_AS_ERRORS' => 'YES',
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.script_phase = {
    :name => 'Copy Swift Header',
    :script => 'COMPATIBILITY_HEADER_PATH="${BUILT_PRODUCTS_DIR}/Swift Compatibility Header/${PRODUCT_MODULE_NAME}-Swift.h"; ditto "${COMPATIBILITY_HEADER_PATH}" "${PODS_ROOT}/Headers/Public/${PRODUCT_MODULE_NAME}/${PRODUCT_MODULE_NAME}-Swift.h"',
    :execution_position => :after_compile
  }
end
