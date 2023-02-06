# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

# Whether Hermes is built for Release or Debug is determined by the PRODUCTION envvar.
build_type = ENV['PRODUCTION'] == "1" ? :release : :debug

# package.json
package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']



folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.07.22.00'
boost_compiler_flags = '-Wno-documentation'

Pod::Spec.new do |s|
  s.name                   = "ABI48_0_0React-hermes"
  s.version                = version
  s.summary                = "Hermes engine for React Native"
  s.homepage               = "https://reactnative.dev/"
  s.license                = package['license']
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :osx => "10.14", :ios => "12.4" }
  s.source                 = { :path => "." }
  s.source_files           = "executor/*.{cpp,h}",
                             "inspector/*.{cpp,h}",
                             "inspector/chrome/*.{cpp,h}",
                             "inspector/detail/*.{cpp,h}"
  s.public_header_files    = "executor/HermesExecutorFactory.h"
  s.compiler_flags         = folly_compiler_flags + ' ' + boost_compiler_flags
  s.pod_target_xcconfig    = {
                               "HEADER_SEARCH_PATHS" => "\"${PODS_ROOT}/hermes-engine/destroot/include\" \"$(PODS_TARGET_SRCROOT)/..\" \"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/libevent/include\""
                             }.merge!(build_type == :debug ? { "GCC_PREPROCESSOR_DEFINITIONS" => "HERMES_ENABLE_DEBUGGER=1" } : {})
  s.header_dir             = "ABI48_0_0reacthermes"
  s.dependency "ABI48_0_0React-cxxreact", version
  s.dependency "ABI48_0_0React-jsiexecutor", version
  s.dependency "ABI48_0_0React-jsinspector", version
  s.dependency "ABI48_0_0React-perflogger", version
  s.dependency "RCT-Folly", folly_version
  s.dependency "DoubleConversion"
  s.dependency "glog"
  s.dependency "RCT-Folly/Futures", folly_version
  s.dependency "ABI48_0_0hermes-engine"
  s.dependency "ABI48_0_0React-jsi"
end
