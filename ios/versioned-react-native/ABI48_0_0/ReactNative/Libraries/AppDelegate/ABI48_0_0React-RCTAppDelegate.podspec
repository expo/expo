# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']



folly_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1'
folly_compiler_flags = folly_flags + ' ' + '-Wno-comma -Wno-shorten-64-to-32'

new_arch_enabled_flag="RCT_NEW_ARCH_ENABLED"
is_new_arch_enabled = ENV[new_arch_enabled_flag] == "1"
other_cflags = "$(inherited) -DRN_FABRIC_ENABLED " + folly_flags + (is_new_arch_enabled ? " -D"+"RCT_NEW_ARCH_ENABLED" : "")

use_hermes = ENV['USE_HERMES'] == '1'

header_search_paths = [
  "$(PODS_TARGET_SRCROOT)/ReactCommon",
  "$(PODS_ROOT)/Headers/Private/React-Core",
  "$(PODS_ROOT)/boost",
  "$(PODS_ROOT)/DoubleConversion",
  "$(PODS_ROOT)/RCT-Folly",
  "${PODS_ROOT}/Headers/Public/FlipperKit",
  "$(PODS_ROOT)/Headers/Public/ReactCommon",
  "$(PODS_ROOT)/Headers/Public/React-RCTFabric"
].concat(use_hermes ? [
  "$(PODS_ROOT)/Headers/Public/React-hermes",
  "$(PODS_ROOT)/Headers/Public/hermes-engine"
] : []).map{|p| "\"#{p}\""}.join(" ")

Pod::Spec.new do |s|
  s.name            = "ABI48_0_0React-RCTAppDelegate"
  s.version                = version
  s.summary                = "An utility library to simplify common operations for the New Architecture"
  s.homepage               = "https://reactnative.dev/"
  s.documentation_url      = "https://reactnative.dev/docs/actionsheetios"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "12.4" }
  s.source                 = { :path => "." }
  s.source_files            = "**/*.{c,h,m,mm,S,cpp}"

  # This guard prevent to install the dependencies when we run `pod install` in the old architecture.
  s.compiler_flags = other_cflags
  s.pod_target_xcconfig    = {
    "HEADER_SEARCH_PATHS" => header_search_paths,
    "OTHER_CPLUSPLUSFLAGS" => other_cflags,
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17", "DEFINES_MODULE" => "YES",
  }
  s.user_target_xcconfig   = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/Headers/Private/React-Core\""}

  s.dependency "ABI48_0_0React-Core"
  s.dependency "RCT-Folly"
  s.dependency "ABI48_0_0RCTRequired"
  s.dependency "ABI48_0_0RCTTypeSafety"
  s.dependency "ABI48_0_0ReactCommon/turbomodule/core"

  if is_new_arch_enabled
    s.dependency "ABI48_0_0React-RCTFabric"
    s.dependency "ABI48_0_0React-graphics"
  end
end
