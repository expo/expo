# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))
version = package['version']



folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32 -Wno-gnu-zero-variadic-macro-arguments'
folly_version = '2021.07.22.00'
folly_dep_name = 'RCT-Folly/Fabric'
boost_compiler_flags = '-Wno-documentation'
react_native_path = ".."

Pod::Spec.new do |s|
  s.name                   = "ABI49_0_0React-Fabric"
  s.version                = version
  s.summary                = "Fabric for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = { :ios => "12.4" }
  s.source                 = { :path => "." }
  s.source_files           = "dummyFile.cpp"
  s.pod_target_xcconfig = { "USE_HEADERMAP" => "YES",
                            "CLANG_CXX_LANGUAGE_STANDARD" => "c++17" }

  if ENV['USE_FRAMEWORKS']
    s.header_mappings_dir     = './'
    s.module_name             = 'ABI49_0_0React_Fabric'
  end

  s.dependency folly_dep_name, folly_version
  s.dependency "ABI49_0_0React-graphics", version
  s.dependency "ABI49_0_0React-jsiexecutor", version
  s.dependency "ABI49_0_0RCTRequired", version
  s.dependency "ABI49_0_0RCTTypeSafety", version
  s.dependency "ABI49_0_0ReactCommon/turbomodule/core", version
  s.dependency "ABI49_0_0React-jsi", version
  s.dependency "ABI49_0_0React-logger"
  s.dependency "glog"
  s.dependency "DoubleConversion"
  s.dependency "ABI49_0_0React-Core"
  s.dependency "ABI49_0_0React-debug"
  s.dependency "ABI49_0_0React-utils"
  s.dependency "ABI49_0_0React-runtimescheduler"

  if ENV["USE_HERMES"] == nil || ENV["USE_HERMES"] == "1"
    s.dependency "ABI49_0_0hermes-engine"
  else
    s.dependency "ABI49_0_0React-jsi"
  end

  s.subspec "animations" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/animations/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/animations/tests"
    ss.header_dir           = "ABI49_0_0react/renderer/animations"
  end

  s.subspec "attributedstring" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/attributedstring/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/attributedstring/tests"
    ss.header_dir           = "ABI49_0_0react/renderer/attributedstring"
  end

  s.subspec "butter" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "butter/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "butter/tests"
    ss.header_dir           = "ABI49_0_0butter"
  end

  s.subspec "config" do |ss|
    ss.source_files         = "react/config/*.{m,mm,cpp,h}"
    ss.header_dir           = "ABI49_0_0react/config"
  end

  s.subspec "core" do |ss|
    header_search_path = [
      "\"$(PODS_ROOT)/boost\"",
      "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"",
      "\"$(PODS_ROOT)/RCT-Folly\"",
    ]

    if ENV['USE_FRAMEWORKS']
      header_search_path = header_search_path + [
        "\"$(PODS_TARGET_SRCROOT)\"",
        "\"$(PODS_ROOT)/DoubleConversion\"",
        "\"$(PODS_CONFIGURATION_BUILD_DIR)/React-Codegen/React_Codegen.framework/Headers\"",
        "\"$(PODS_CONFIGURATION_BUILD_DIR)/React-graphics/React_graphics.framework/Headers/react/renderer/graphics/platform/ios\"",
        "\"$(PODS_TARGET_SRCROOT)/react/renderer/textlayoutmanager/platform/ios\"",
        "\"$(PODS_TARGET_SRCROOT)/react/renderer/components/textinput/iostextinput\""
      ]
    end

    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags + ' ' + boost_compiler_flags
    ss.source_files         = "react/renderer/core/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/core/tests"
    ss.header_dir           = "ABI49_0_0react/renderer/core"
    ss.pod_target_xcconfig  = {
      "HEADER_SEARCH_PATHS" => header_search_path.join(" ")
    }
  end

  s.subspec "componentregistry" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/componentregistry/**/*.{m,mm,cpp,h}"
    ss.header_dir           = "ABI49_0_0react/renderer/componentregistry"
  end

  s.subspec "componentregistrynative" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/componentregistry/native/**/*.{m,mm,cpp,h}"
    ss.header_dir           = "ABI49_0_0react/renderer/componentregistry/native"
  end

  s.subspec "components" do |ss|
    ss.subspec "activityindicator" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/activityindicator/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/activityindicator/tests"
      sss.header_dir           = "ABI49_0_0react/renderer/components/activityindicator"
    end

    ss.subspec "image" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/image/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/image/tests"
      sss.header_dir           = "ABI49_0_0react/renderer/components/image"
    end

    ss.subspec "inputaccessory" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/inputaccessory/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/inputaccessory/tests"
      sss.header_dir           = "ABI49_0_0react/renderer/components/inputaccessory"
    end

    ss.subspec "legacyviewmanagerinterop" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/legacyviewmanagerinterop/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/legacyviewmanagerinterop/tests"
      sss.header_dir           = "ABI49_0_0react/renderer/components/legacyviewmanagerinterop"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/Headers/Private/React-Core\"" }
    end

    ss.subspec "modal" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/modal/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/modal/tests"
      sss.header_dir           = "ABI49_0_0react/renderer/components/modal"
    end

    ss.subspec "rncore" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/rncore/**/*.{m,mm,cpp,h}"
      sss.header_dir           = "ABI49_0_0react/renderer/components/rncore"
    end

    ss.subspec "root" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/root/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/root/tests"
      sss.header_dir           = "ABI49_0_0react/renderer/components/root"
    end

    ss.subspec "safeareaview" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/safeareaview/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/safeareaview/tests"
      sss.header_dir           = "ABI49_0_0react/renderer/components/safeareaview"

    end

    ss.subspec "scrollview" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/scrollview/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/scrollview/tests"
      sss.header_dir           = "ABI49_0_0react/renderer/components/scrollview"

    end

    ss.subspec "text" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/text/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/text/tests"
      sss.header_dir           = "ABI49_0_0react/renderer/components/text"

    end

    ss.subspec "textinput" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/textinput/iostextinput/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/textinput/iostextinput/tests"
      sss.header_dir           = "ABI49_0_0react/renderer/components/iostextinput"

    end

    ss.subspec "unimplementedview" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/unimplementedview/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/unimplementedview/tests"
      sss.header_dir           = "ABI49_0_0react/renderer/components/unimplementedview"

    end

    ss.subspec "view" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.dependency             "ABI49_0_0Yoga"
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/view/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/view/tests"
      sss.header_dir           = "ABI49_0_0react/renderer/components/view"

    end
  end

  s.subspec "debug_renderer" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/debug/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/debug/tests"
    ss.header_dir           = "ABI49_0_0react/renderer/debug"
  end

  s.subspec "imagemanager" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/imagemanager/*.{m,mm,cpp,h}"
    ss.header_dir           = "ABI49_0_0react/renderer/imagemanager"
  end

  s.subspec "mapbuffer" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/mapbuffer/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/mapbuffer/tests"
    ss.header_dir           = "ABI49_0_0react/renderer/mapbuffer"
  end

  s.subspec "mounting" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/mounting/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/mounting/tests"
    ss.header_dir           = "ABI49_0_0react/renderer/mounting"
  end

  s.subspec "scheduler" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/scheduler/**/*.{m,mm,cpp,h}"
    ss.header_dir           = "ABI49_0_0react/renderer/scheduler"
  end

  s.subspec "templateprocessor" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/templateprocessor/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/templateprocessor/tests"
    ss.header_dir           = "ABI49_0_0react/renderer/templateprocessor"
  end

  s.subspec "textlayoutmanager" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.dependency             "ABI49_0_0React-Fabric/uimanager"
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/textlayoutmanager/platform/ios/**/*.{m,mm,cpp,h}",
                              "react/renderer/textlayoutmanager/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/textlayoutmanager/tests",
                              "react/renderer/textlayoutmanager/platform/android",
                              "react/renderer/textlayoutmanager/platform/cxx"
    ss.header_dir           = "ABI49_0_0react/renderer/textlayoutmanager"
  end

  s.subspec "uimanager" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/uimanager/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/uimanager/tests"
    ss.header_dir           = "ABI49_0_0react/renderer/uimanager"
  end

  s.subspec "telemetry" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/telemetry/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/telemetry/tests"
    ss.header_dir           = "ABI49_0_0react/renderer/telemetry"

  end

  s.subspec "leakchecker" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/leakchecker/**/*.{cpp,h}"
    ss.exclude_files        = "react/renderer/leakchecker/tests"
    ss.header_dir           = "ABI49_0_0react/renderer/leakchecker"
    ss.pod_target_xcconfig  = { "GCC_WARN_PEDANTIC" => "YES" }
  end
end
