# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']



Pod::Spec.new do |s|
  s.name                   = "ABI42_0_0React-RCTActionSheet"
  s.version                = version
  s.summary                = "An API for displaying iOS action sheets and share sheets."
  s.homepage               = "https://reactnative.dev/"
  s.documentation_url      = "https://reactnative.dev/docs/actionsheetios"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "10.0", :tvos => "10.0" }
  s.source                 = { :path => "." }
  s.source_files           = "*.{m}"
  s.preserve_paths          = "package.json", "LICENSE", "LICENSE-docs"
  s.header_dir             = "ABI42_0_0RCTActionSheet"

  s.dependency "ABI42_0_0React-Core/RCTActionSheetHeaders", version
end
