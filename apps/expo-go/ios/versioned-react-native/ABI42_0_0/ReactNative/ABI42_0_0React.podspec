# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip
else
  source[:tag] = "v#{version}"
end

Pod::Spec.new do |s|
  s.name                   = "ABI42_0_0React"
  s.version                = version
  s.summary                = package["description"]
  s.description            = <<-DESC
                               React Native apps are built using the React JS
                               framework, and render directly to native UIKit
                               elements using a fully asynchronous architecture.
                               There is no browser and no HTML. We have picked what
                               we think is the best set of features from these and
                               other technologies to build what we hope to become
                               the best product development framework available,
                               with an emphasis on iteration speed, developer
                               delight, continuity of technology, and absolutely
                               beautiful and fast products with no compromises in
                               quality or capability.
                             DESC
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "10.0", :tvos => "10.0" }
  s.source                 = { :path => "." }
  s.preserve_paths         = "package.json", "LICENSE", "LICENSE-docs"
  s.cocoapods_version      = ">= 1.2.0"

  s.dependency "ABI42_0_0React-Core", version
  s.dependency "ABI42_0_0React-Core/DevSupport", version
  s.dependency "ABI42_0_0React-Core/RCTWebSocket", version
  s.dependency "ABI42_0_0React-RCTActionSheet", version
  s.dependency "ABI42_0_0React-RCTAnimation", version
  s.dependency "ABI42_0_0React-RCTBlob", version
  s.dependency "ABI42_0_0React-RCTImage", version
  s.dependency "ABI42_0_0React-RCTLinking", version
  s.dependency "ABI42_0_0React-RCTNetwork", version
  s.dependency "ABI42_0_0React-RCTSettings", version
  s.dependency "ABI42_0_0React-RCTText", version
  s.dependency "ABI42_0_0React-RCTVibration", version
end
