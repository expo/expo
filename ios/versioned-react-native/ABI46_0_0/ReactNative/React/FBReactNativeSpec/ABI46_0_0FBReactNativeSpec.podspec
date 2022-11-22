# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

react_native_path = "../.."
require_relative "#{react_native_path}/scripts/react_native_pods.rb"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']



folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.07.22.00'

Pod::Spec.new do |s|
  s.name                   = "ABI46_0_0FBReactNativeSpec"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "12.4" }
  s.compiler_flags         = folly_compiler_flags + ' -Wno-nullability-completeness'
  s.source                 = { :path => "." }
  # This podspec is used to trigger the codegen, and built files are generated in a different location.
  # We don't want this pod to actually include any files.
  s.header_dir             = "ABI46_0_0FBReactNativeSpec"

  s.pod_target_xcconfig    = {
                               "USE_HEADERMAP" => "YES",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
                               "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/RCT-Folly\""
                             }

  s.dependency "RCT-Folly", folly_version
  s.dependency "ABI46_0_0RCTRequired", version
  s.dependency "ABI46_0_0RCTTypeSafety", version
  s.dependency "ABI46_0_0React-Core", version
  s.dependency "ABI46_0_0React-jsi", version
  s.dependency "ABI46_0_0ReactCommon/turbomodule/core", version
end
