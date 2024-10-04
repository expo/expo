# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))
version = package['version']



folly_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1'
folly_compiler_flags = folly_flags + ' ' + '-Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.07.22.00'
boost_compiler_flags = '-Wno-documentation'

Pod::Spec.new do |s|
  s.name                   = "ABI47_0_0React-RCTFabric"
  s.version                = version
  s.summary                = "RCTFabric for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "12.4" }
  s.source                 = { :path => "." }
  s.source_files           = "Fabric/**/*.{c,h,m,mm,S,cpp}"
  s.exclude_files          = "**/tests/*",
                             "**/android/*",
  s.compiler_flags         = folly_compiler_flags + ' ' + boost_compiler_flags
  s.header_dir             = "ABI47_0_0React"
  s.module_name            = "ABI47_0_0RCTFabric"
  s.framework              = "JavaScriptCore"
  s.pod_target_xcconfig    = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/Headers/Private/React-Core\" \"$(PODS_ROOT)/Headers/Public/React-Codegen\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Codegen/React_Codegen.framework/Headers\"" }
  s.xcconfig               = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/glog\" \"$(PODS_ROOT)/RCT-Folly\"", "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
                               "OTHER_CFLAGS" => "$(inherited) -DRN_FABRIC_ENABLED" + " " + folly_flags  }

  s.dependency "ABI47_0_0React-Core", version
  s.dependency "ABI47_0_0React-Fabric", version
  s.dependency "ABI47_0_0React-RCTImage", version
  s.dependency "RCT-Folly/Fabric", folly_version

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = "Tests/**/*.{mm}"
    test_spec.framework = "XCTest"
  end
end
