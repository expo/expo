# coding: utf-8
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']



Pod::Spec.new do |s|
  s.name                   = "ABI37_0_0React-RCTPushNotification"
  s.version                = version
  s.summary                = "A library for handling push notifications for your app, including permission handling and icon badge number." 
  s.homepage               = "http://facebook.github.io/react-native/"
  s.documentation_url      = "https://facebook.github.io/react-native/docs/pushnotificationios"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "9.0", :tvos => "9.2" }
  s.source                 = { :path => "." }
  s.source_files           = "*.{m}"
  s.preserve_paths         = "package.json", "LICENSE", "LICENSE-docs"
  s.header_dir             = "ABI37_0_0RCTPushNotification"

  s.dependency "ABI37_0_0React-Core/RCTPushNotificationHeaders", version
end
