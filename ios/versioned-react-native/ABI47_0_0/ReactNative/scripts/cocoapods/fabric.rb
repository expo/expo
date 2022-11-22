# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


# It sets up the faric dependencies.
#
# @parameter prefix: prefix to use to reach react-native
# @parameter new_arch_enabled: whether the new arch is enabled or not
# @parameter codegen_output_dir: the directory where the code is generated
def setup_fabric!(prefix)
    pod 'ABI47_0_0React-Fabric', :path => "#{prefix}/ReactCommon", :project_name => 'ABI47_0_0'
    pod 'ABI47_0_0React-rncore', :path => "#{prefix}/ReactCommon", :project_name => 'ABI47_0_0'
    pod 'ABI47_0_0React-graphics', :path => "#{prefix}/ReactCommon/react/renderer/graphics", :project_name => 'ABI47_0_0'
    pod 'ABI47_0_0React-jsi/Fabric', :path => "#{prefix}/ReactCommon/jsi", :project_name => 'ABI47_0_0'
    pod 'ABI47_0_0React-RCTFabric', :path => "#{prefix}/React", :project_name => 'ABI47_0_0', :modular_headers => true
    # pod 'ABI47_0_0RCT-Folly/Fabric', :podspec => "#{prefix}/third-party-podspecs/RCT-Folly.podspec"
end
