# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))
version = package['version']



folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.07.22.00'
boost_compiler_flags = '-Wno-documentation'

Pod::Spec.new do |s|
  s.name                   = "ABI47_0_0ReactCommon"
  s.module_name            = "ABI47_0_0ReactCommon"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "12.4" }
  s.source                 = { :path => "." }
  s.header_dir             = "ABI47_0_0ReactCommon" # Use global header_dir for all subspecs for use_frameworks! compatibility
  s.compiler_flags         = folly_compiler_flags + ' ' + boost_compiler_flags
  s.pod_target_xcconfig    = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/Headers/Private/ABI47_0_0React-Core\" \"$(PODS_ROOT)/Headers/Private/ABI47_0_0React-bridging/react/bridging\" \"$(PODS_CONFIGURATION_BUILD_DIR)/ABI47_0_0React-bridging/react_bridging.framework/Headers\"",
                               "USE_HEADERMAP" => "YES", "DEFINES_MODULE" => "YES",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++17" }

  # TODO (T48588859): Restructure this target to align with dir structure: "react/nativemodule/..."
  # Note: Update this only when ready to minimize breaking changes.
  s.subspec "turbomodule" do |ss|
    ss.dependency "ABI47_0_0React-bridging", version
    ss.dependency "ABI47_0_0React-callinvoker", version
    ss.dependency "ABI47_0_0React-perflogger", version
    ss.dependency "ABI47_0_0React-Core", version
    ss.dependency "ABI47_0_0React-cxxreact", version
    ss.dependency "ABI47_0_0React-jsi", version
    ss.dependency "RCT-Folly", folly_version
    s.dependency "ABI47_0_0React-logger", version
    ss.dependency "DoubleConversion"
    ss.dependency "glog"

    ss.subspec "core" do |sss|
      sss.source_files = "react/nativemodule/core/ReactCommon/**/*.{cpp,h}",
                         "react/nativemodule/core/platform/ios/**/*.{mm,cpp,h}"
    end

    s.subspec "react_debug_core" do |sss|
        sss.source_files = "react/debug/*.{cpp,h}"
    end

    ss.subspec "samples" do |sss|
      sss.source_files = "react/nativemodule/samples/ReactCommon/**/*.{cpp,h}",
                         "react/nativemodule/samples/platform/ios/**/*.{mm,cpp,h}"
      sss.dependency "ABI47_0_0ReactCommon/turbomodule/core", version
    end
  end
end
