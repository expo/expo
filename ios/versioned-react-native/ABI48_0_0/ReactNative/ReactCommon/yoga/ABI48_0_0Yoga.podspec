# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

package = JSON.parse(File.read(File.expand_path('../../package.json', __dir__)))
version = package['version']



Pod::Spec.new do |spec|
  spec.name = 'ABI48_0_0Yoga'
  spec.version = '1.14.0'
  spec.license =  { :type => 'MIT' }
  spec.homepage = 'https://yogalayout.com'
  spec.documentation_url = 'https://yogalayout.com/docs/'

  spec.summary = 'Yoga is a cross-platform layout engine which implements Flexbox.'
  spec.description = 'Yoga is a cross-platform layout engine enabling maximum collaboration within your team by implementing an API many designers are familiar with, and opening it up to developers across different platforms.'

  spec.authors = 'Facebook'
  spec.source = { :path => "." }

  spec.module_name = 'ABI48_0_0yoga'
  spec.header_dir = 'ABI48_0_0yoga'
  spec.requires_arc = false
  spec.pod_target_xcconfig = {
      'DEFINES_MODULE' => 'YES'
  }
  spec.compiler_flags = [
      '-fno-omit-frame-pointer',
      '-fexceptions',
      '-Wall',
      '-Werror',
      '-std=c++17',
      '-fPIC'
  ]

  # Pinning to the same version as React.podspec.
  spec.platforms = { :ios => "12.4" }

  # Set this environment variable when *not* using the `:path` option to install the pod.
  # E.g. when publishing this spec to a spec repo.
  source_files = 'yoga/**/*.{cpp,h}'
  source_files = File.join('ReactCommon/yoga', source_files) if ENV['INSTALL_YOGA_WITHOUT_PATH_OPTION']
  spec.source_files = source_files

  header_files = 'yoga/*.h'
  header_files = File.join('ReactCommon/yoga', header_files) if ENV['INSTALL_YOGA_WITHOUT_PATH_OPTION']
  spec.public_header_files = header_files
end
