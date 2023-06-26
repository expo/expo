# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "..", "..", "..", "..", "package.json")))
version = package['version']



folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32 -Wno-gnu-zero-variadic-macro-arguments'
folly_version = '2021.07.22.00'
boost_compiler_flags = '-Wno-documentation'
using_hermes = ENV['USE_HERMES'] == nil || ENV['USE_HERMES'] == "1"
Pod::Spec.new do |s|
    s.name                   = "ABI49_0_0React-NativeModulesApple"
    s.module_name            = "ABI49_0_0React_NativeModulesApple"
    s.header_dir             = "ABI49_0_0ReactCommon" # Use global header_dir for all subspecs for use_frameworks! compatibility
    s.version                = version
    s.summary                = "-"
    s.homepage               = "https://reactnative.dev/"
    s.license                = package["license"]
    s.author                 = "Meta Platforms, Inc. and its affiliates"
    s.platforms              = { :ios => "12.4" }
    s.source                 = { :path => "." }
    s.compiler_flags         = folly_compiler_flags + ' ' + boost_compiler_flags
    s.pod_target_xcconfig    = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/Headers/Private/ABI49_0_0React-Core\"",
                                "USE_HEADERMAP" => "YES",
                                "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
                                "GCC_WARN_PEDANTIC" => "YES" }
    if ENV['USE_FRAMEWORKS']
        s.header_mappings_dir     = './'
    end

    s.source_files = "ReactCommon/**/*.{mm,cpp,h}"

    s.dependency "ABI49_0_0ReactCommon/turbomodule/core"
    s.dependency "ABI49_0_0ReactCommon/turbomodule/bridging"
    s.dependency "ABI49_0_0React-callinvoker"
    s.dependency "ABI49_0_0React-Core"
    s.dependency "ABI49_0_0React-cxxreact"
    s.dependency "ABI49_0_0React-runtimeexecutor"
    s.dependency "ABI49_0_0React-jsi"

    if using_hermes
      s.dependency "ABI49_0_0hermes-engine"
    end
end
