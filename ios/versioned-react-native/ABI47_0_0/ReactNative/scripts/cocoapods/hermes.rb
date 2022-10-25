# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

def install_hermes_if_enabled(hermes_enabled, react_native_path)
    unless hermes_enabled
        return
    end

    pod 'ABI47_0_0React-hermes', :path => "#{react_native_path}/ReactCommon/hermes", :project_name => 'ABI47_0_0'
    pod 'libevent', '~> 2.1.12'
    pod 'ABI47_0_0hermes-engine', :podspec => "#{react_native_path}/sdks/hermes-engine/ABI47_0_0hermes-engine.podspec", :project_name => 'ABI47_0_0'
end
