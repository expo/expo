# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']



Pod::Spec.new do |s|
  s.name                   = "ABI47_0_0RCTTypeSafety"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "12.4" }
  s.source                 = { :path => "." }
  s.source_files           = "**/*.{c,h,m,mm,cpp}"
  s.header_dir             = "ABI47_0_0RCTTypeSafety"
  s.pod_target_xcconfig    = {
                               "USE_HEADERMAP" => "YES",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
                               "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/Libraries/TypeSafety\""
                             }

  s.dependency "ABI47_0_0FBLazyVector", version
  s.dependency "ABI47_0_0RCTRequired", version
  s.dependency "ABI47_0_0React-Core", version
end
