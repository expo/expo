# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']



Pod::Spec.new do |s|
  s.name                   = "ABI49_0_0React-jsc"
  s.version                = version
  s.summary                = "JavaScriptCore engine for React Native"
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = { :ios => "12.4" }
  s.source                 = { :path => "." }
  s.source_files           = "ABI49_0_0JSCRuntime.{cpp,h}"
  s.exclude_files          = "**/test/*"
  s.framework              = "JavaScriptCore"

  s.dependency "ABI49_0_0React-jsi", version

  s.subspec "Fabric" do |ss|
    ss.pod_target_xcconfig  = { "OTHER_CFLAGS" => "$(inherited) -DRN_FABRIC_ENABLED" }
  end
end
