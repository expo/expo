# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "..", "package.json")))
version = package['version']



folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2020.01.13.00'

Pod::Spec.new do |s|
  s.name                   = "ABI41_0_0React-graphics"
  s.version                = version
  s.summary                = "Fabric for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "9.0", :tvos => "10.0" }
  s.source                 = { :path => "." }
  s.library                = "stdc++"
  s.compiler_flags         = folly_compiler_flags
  s.source_files           = "**/*.{m,mm,cpp,h}"
  s.exclude_files          = "**/tests/*",
                             "**/android/*",
                             "**/cxx/*"
  s.header_dir             = "ABI41_0_0react/graphics"
  s.pod_target_xcconfig  = { "USE_HEADERMAP" => "NO", "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/Folly\"" }

  s.dependency "Folly/Fabric", folly_version
end
