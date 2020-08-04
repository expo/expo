# coding: utf-8
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']



Pod::Spec.new do |s|
  s.name                   = "ABI37_0_0React-RCTBlob"
  s.version                = version
  s.summary                = "An API for displaying iOS action sheets and share sheets."
  s.homepage               = "http://facebook.github.io/react-native/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "9.0", :tvos => "9.2" }
  s.source                 = { :path => "." }
  # RCTBlobCollector.h is not included in the React module as it has C++ code
  s.source_files           = "*.{m,mm}", "RCTBlobCollector.h"
  s.preserve_paths         = "package.json", "LICENSE", "LICENSE-docs"
  s.header_dir             = "ABI37_0_0RCTBlob"

  s.dependency "ABI37_0_0React-Core/RCTBlobHeaders", version
  s.dependency "ABI37_0_0React-Core/RCTWebSocket", version
  s.dependency "ABI37_0_0React-RCTNetwork", version
  s.dependency "ABI37_0_0React-jsi", version
end
