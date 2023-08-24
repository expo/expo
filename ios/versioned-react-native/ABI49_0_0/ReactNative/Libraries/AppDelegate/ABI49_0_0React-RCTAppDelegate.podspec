# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']



folly_flags = ' -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1'
folly_compiler_flags = folly_flags + ' ' + '-Wno-comma -Wno-shorten-64-to-32'

is_new_arch_enabled = ENV["RCT_NEW_ARCH_ENABLED"] == "1"
new_arch_enabled_flag = (is_new_arch_enabled ? " -DRCT_NEW_ARCH_ENABLED" : "")
is_fabric_enabled = is_new_arch_enabled || ENV["RCT_FABRIC_ENABLED"]
fabric_flag = (is_fabric_enabled ? " -DRN_FABRIC_ENABLED" : "")
other_cflags = "$(inherited)" + folly_flags + new_arch_enabled_flag + fabric_flag

use_hermes = ENV['USE_HERMES'] == '1'
use_frameworks = ENV['USE_FRAMEWORKS'] != nil

header_search_paths = [
  "$(PODS_TARGET_SRCROOT)/ReactCommon",
  "$(PODS_ROOT)/Headers/Private/ABI49_0_0React-Core",
  "$(PODS_ROOT)/boost",
  "$(PODS_ROOT)/DoubleConversion",
  "$(PODS_ROOT)/RCT-Folly",
  "${PODS_ROOT}/Headers/Public/FlipperKit",
  "$(PODS_ROOT)/Headers/Public/ABI49_0_0ReactCommon",
  "$(PODS_ROOT)/Headers/Public/ABI49_0_0React-RCTFabric"
].concat(use_hermes ? [
  "$(PODS_ROOT)/Headers/Public/ABI49_0_0React-hermes",
  "$(PODS_ROOT)/Headers/Public/ABI49_0_0hermes-engine"
] : []).concat(use_frameworks ? [
  "$(PODS_CONFIGURATION_BUILD_DIR)/React-Fabric/React_Fabric.framework/Headers/",
  "$(PODS_CONFIGURATION_BUILD_DIR)/React-graphics/React_graphics.framework/Headers/",
  "$(PODS_CONFIGURATION_BUILD_DIR)/React-graphics/React_graphics.framework/Headers/react/renderer/graphics/platform/ios",
  "$(PODS_CONFIGURATION_BUILD_DIR)/ABI49_0_0ReactCommon/ReactCommon.framework/Headers/react/nativemodule/core",
  "$(PODS_CONFIGURATION_BUILD_DIR)/React-NativeModulesApple/React_NativeModulesApple.framework/Headers",
  "$(PODS_CONFIGURATION_BUILD_DIR)/ABI49_0_0React-RCTFabric/RCTFabric.framework/Headers/",
  "$(PODS_CONFIGURATION_BUILD_DIR)/React-utils/React_utils.framework/Headers/",
  "$(PODS_CONFIGURATION_BUILD_DIR)/React-debug/React_debug.framework/Headers/",
  "$(PODS_CONFIGURATION_BUILD_DIR)/React-runtimescheduler/React_runtimescheduler.framework/Headers/",
] : []).map{|p| "\"#{p}\""}.join(" ")

Pod::Spec.new do |s|
  s.name            = "ABI49_0_0React-RCTAppDelegate"
  s.version                = version
  s.summary                = "An utility library to simplify common operations for the New Architecture"
  s.homepage               = "https://reactnative.dev/"
  s.documentation_url      = "https://reactnative.dev/docs/actionsheetios"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
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
  s.user_target_xcconfig   = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/Headers/Private/ABI49_0_0React-Core\""}

  s.dependency "ABI49_0_0React-Core"
  s.dependency "RCT-Folly"
  s.dependency "ABI49_0_0RCTRequired"
  s.dependency "ABI49_0_0RCTTypeSafety"
  s.dependency "ABI49_0_0ReactCommon/turbomodule/core"
  s.dependency "ABI49_0_0React-RCTNetwork"
  s.dependency "ABI49_0_0React-RCTImage"
  s.dependency "ABI49_0_0React-NativeModulesApple"
  s.dependency "ABI49_0_0React-CoreModules"
  s.dependency "ABI49_0_0React-runtimescheduler"

  if ENV['USE_HERMES'] == nil || ENV['USE_HERMES'] == "1"
    s.dependency "ABI49_0_0React-hermes"
  else
    s.dependency "ABI49_0_0React-jsc"
  end

  if is_new_arch_enabled
    s.dependency "ABI49_0_0React-RCTFabric"
    s.dependency "ABI49_0_0React-graphics"
    s.dependency "ABI49_0_0React-utils"
    s.dependency "ABI49_0_0React-debug"

    s.script_phases = {
      :name => "Generate Legacy Components Interop",
      :script => "
WITH_ENVIRONMENT=\"$REACT_NATIVE_PATH/scripts/xcode/with-environment.sh\"
source $WITH_ENVIRONMENT
${NODE_BINARY} ${REACT_NATIVE_PATH}/scripts/codegen/generate-legacy-interop-components.js -p #{ENV['APP_PATH']} -o ${REACT_NATIVE_PATH}/Libraries/AppDelegate
      ",
      :execution_position => :before_compile,
      :input_files => ["#{ENV['APP_PATH']}/react-native.config.js"],
      :output_files => ["${REACT_NATIVE_PATH}/Libraries/AppDelegate/RCTLegacyInteropComponents.mm"],
    }
  end
end
