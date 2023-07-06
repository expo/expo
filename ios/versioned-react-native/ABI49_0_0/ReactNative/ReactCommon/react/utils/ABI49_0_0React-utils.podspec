# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "..", "package.json")))
version = package['version']



folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.07.22.00'

header_search_paths = [
    "\"$(PODS_ROOT)/RCT-Folly\"",
    "\"$(PODS_TARGET_SRCROOT)\"",
    "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"",
]

if ENV["USE_FRAMEWORKS"]
  header_search_paths << "\"${PODS_CONFIGURATION_BUILD_DIR}/React-debug/React_debug.framework/Headers\""
end

Pod::Spec.new do |s|
  s.name                   = "ABI49_0_0React-utils"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = { :ios => min_ios_version_supported }
  s.source                 = { :path => "." }
  s.source_files           = "**/*.{cpp,h,mm}"
  s.compiler_flags         = folly_compiler_flags
  s.header_dir             = "ABI49_0_0react/utils"
  s.exclude_files          = "tests"
  s.pod_target_xcconfig    = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
    "HEADER_SEARCH_PATHS" => header_search_paths.join(' ')}

  if ENV['USE_FRAMEWORKS']
    s.module_name            = "ABI49_0_0React_utils"
    s.header_mappings_dir  = "../.."
  end

  s.dependency "RCT-Folly", folly_version
  s.dependency "ABI49_0_0React-debug"
  s.dependency "glog"
end
