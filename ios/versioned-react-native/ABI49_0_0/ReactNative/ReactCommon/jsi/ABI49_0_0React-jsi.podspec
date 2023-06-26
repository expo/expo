# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

js_engine = ENV['USE_HERMES'] == "0" ?
  :jsc :
  :hermes

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']



folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.07.22.00'
boost_compiler_flags = '-Wno-documentation'

# using jsc to expose jsi.h
js_engine = :jsc
Pod::Spec.new do |s|
  s.name                   = "ABI49_0_0React-jsi"
  s.version                = version
  s.summary                = "JavaScript Interface layer for React Native"
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = { :ios => "12.4" }
  s.source                 = { :path => "." }

  s.header_dir    = "ABI49_0_0jsi"
  s.compiler_flags         = folly_compiler_flags + ' ' + boost_compiler_flags
  s.pod_target_xcconfig    = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/DoubleConversion\"" }

  s.dependency "boost", "1.76.0"
  s.dependency "DoubleConversion"
  s.dependency "RCT-Folly", folly_version
  s.dependency "glog"

  if js_engine == :jsc
    s.source_files  = "**/*.{cpp,h}"
    s.exclude_files = [
                        "jsi/jsilib-posix.cpp",
                        "jsi/jsilib-windows.cpp",
                        "**/test/*"
                      ]

  elsif js_engine == :hermes
    # JSI is provided by hermes-engine when Hermes is enabled
    # Just need to provide JSIDynamic in this case.
    s.source_files = "jsi/JSIDynamic.{cpp,h}"
    s.dependency "ABI49_0_0hermes-engine"
  end
end
