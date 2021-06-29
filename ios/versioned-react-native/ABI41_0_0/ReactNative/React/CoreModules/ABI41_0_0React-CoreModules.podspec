# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']



folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2020.01.13.00'

Pod::Spec.new do |s|
  s.name                   = "ABI41_0_0React-CoreModules"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "10.0", :tvos => "10.0" }
  s.compiler_flags         = folly_compiler_flags + ' -Wno-nullability-completeness'
  s.source                 = { :path => "." }
  s.source_files           = "**/*.{c,m,mm,cpp}"
  s.header_dir             = "ABI41_0_0CoreModules"
  s.pod_target_xcconfig    = {
                               "USE_HEADERMAP" => "YES",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++14",
                               "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/React/CoreModules\" \"$(PODS_ROOT)/Folly\""
                             }

  s.dependency "ABI41_0_0FBReactNativeSpec", version
  s.dependency "Folly", folly_version
  s.dependency "ABI41_0_0RCTTypeSafety", version
  s.dependency "ABI41_0_0React-Core/CoreModulesHeaders", version
  s.dependency "ABI41_0_0React-RCTImage", version
  s.dependency "ABI41_0_0ReactCommon/turbomodule/core", version
  s.dependency "ABI41_0_0React-jsi", version
end
