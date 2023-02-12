# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


# It sets up the Fabric dependencies.
#
# @parameter react_native_path: relative path to react-native
def setup_fabric!(react_native_path: "../node_modules/react-native")
    pod 'ABI48_0_0React-Fabric', :path => "#{react_native_path}/ReactCommon", :project_name => 'ABI48_0_0'
    pod 'ABI48_0_0React-rncore', :path => "#{react_native_path}/ReactCommon", :project_name => 'ABI48_0_0'
    pod 'ABI48_0_0React-graphics', :path => "#{react_native_path}/ReactCommon/react/renderer/graphics", :project_name => 'ABI48_0_0'
    pod 'ABI48_0_0React-RCTFabric', :path => "#{react_native_path}/React", :project_name => 'ABI48_0_0', :modular_headers => true
    # pod 'ABI48_0_0RCT-Folly/Fabric', :podspec => "#{react_native_path}/third-party-podspecs/RCT-Folly.podspec"
end
