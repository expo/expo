# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']



folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.07.22.00'

header_search_paths = [
  "\"$(PODS_ROOT)/RCT-Folly\"",
  "\"${PODS_ROOT}/Headers/Public/React-Codegen/react/renderer/components\"",
  "\"${PODS_CONFIGURATION_BUILD_DIR}/React-Codegen/React_Codegen.framework/Headers\""
]

if ENV["USE_FRAMEWORKS"]
  header_search_paths = header_search_paths.concat([
    "\"$(PODS_CONFIGURATION_BUILD_DIR)/ReactCommon/ReactCommon.framework/Headers/react/nativemodule/core\"",
    "\"$(PODS_CONFIGURATION_BUILD_DIR)/React-NativeModulesApple/React_NativeModulesApple.framework/Headers\""
  ])
end

Pod::Spec.new do |s|
  s.name                   = "ABI49_0_0React-RCTImage"
  s.version                = version
  s.summary                = "A React component for displaying different types of images."
  s.homepage               = "https://reactnative.dev/"
  s.documentation_url      = "https://reactnative.dev/docs/image"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = { :ios => "12.4" }
  s.compiler_flags         = folly_compiler_flags + ' -Wno-nullability-completeness'
  s.source                 = { :path => "." }
  s.source_files           = "*.{m,mm}"
  s.preserve_paths         = "package.json", "LICENSE", "LICENSE-docs"
  s.header_dir             = "ABI49_0_0RCTImage"
  s.pod_target_xcconfig    = {
                               "USE_HEADERMAP" => "YES",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
                               "HEADER_SEARCH_PATHS" => header_search_paths.join(' ')
                             }

  s.dependency "RCT-Folly", folly_version
  s.dependency "ABI49_0_0React-Codegen", version
  s.dependency "ABI49_0_0RCTTypeSafety", version
  s.dependency "ABI49_0_0ReactCommon/turbomodule/core", version
  s.dependency "ABI49_0_0React-jsi", version
  s.dependency "ABI49_0_0React-Core/RCTImageHeaders", version
  s.dependency "ABI49_0_0React-RCTNetwork", version
  s.dependency "ABI49_0_0React-NativeModulesApple", version
end
