# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "..", "..", "package.json")))
version = package['version']



folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.07.22.00'
boost_compiler_flags = '-Wno-documentation'

Pod::Spec.new do |s|
  source_files = "**/*.{m,mm,cpp,h}"
  header_search_paths = [
    "\"$(PODS_ROOT)/boost\"",
    "\"$(PODS_TARGET_SRCROOT)/../../../\"",
    "\"$(PODS_ROOT)/RCT-Folly\"",
  ]

  s.name                   = "ABI49_0_0React-graphics"
  s.version                = version
  s.summary                = "Fabric for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = { :ios => "12.4" }
  s.source                 = { :path => "." }
  s.compiler_flags         = folly_compiler_flags + ' ' + boost_compiler_flags
  s.source_files           = source_files
  s.exclude_files          = "tests",
                             "platform/android",
                             "platform/cxx"
  s.header_dir             = "ABI49_0_0react/renderer/graphics"

  if ENV['USE_FRAMEWORKS']
    s.module_name            = "ABI49_0_0React_graphics"
    s.header_mappings_dir  = "../../.."
    header_search_paths = header_search_paths + ["\"$(PODS_TARGET_SRCROOT)/platform/ios\""]
  end

  s.pod_target_xcconfig  = { "USE_HEADERMAP" => "NO", "HEADER_SEARCH_PATHS" => header_search_paths.join(" ") }

  s.dependency "glog"
  s.dependency "RCT-Folly/Fabric", folly_version
  s.dependency "ABI49_0_0React-Core/Default", version
end
