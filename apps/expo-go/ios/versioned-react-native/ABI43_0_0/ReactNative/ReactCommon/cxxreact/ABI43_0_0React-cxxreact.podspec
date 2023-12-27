# coding: utf-8
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']



folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2020.01.13.00'
boost_compiler_flags = '-Wno-documentation'

Pod::Spec.new do |s|
  s.name                   = "ABI43_0_0React-cxxreact"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "10.0", :tvos => "10.0" }
  s.source                 = { :path => "." }
  s.source_files           = "*.{cpp,h}"
  s.exclude_files          = "ABI43_0_0SampleCxxModule.*"
  s.compiler_flags         = folly_compiler_flags + ' ' + boost_compiler_flags
  s.pod_target_xcconfig    = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/DoubleConversion\"" }
  s.header_dir             = "ABI43_0_0cxxreact"

  s.dependency "boost-for-react-native", "1.63.0"
  s.dependency "DoubleConversion"
  s.dependency "RCT-Folly", folly_version
  s.dependency "glog"
  s.dependency "ABI43_0_0React-jsinspector", version
  s.dependency "ABI43_0_0React-callinvoker", version
  s.dependency "ABI43_0_0React-runtimeexecutor", version
  s.dependency "ABI43_0_0React-perflogger", version
  s.dependency "ABI43_0_0React-jsi", version
end
