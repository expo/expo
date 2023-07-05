# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require_relative './utils.rb'

# It sets up the JavaScriptCore and JSI pods.
#
# @parameter react_native_path: relative path to react-native
# @parameter fabric_enabled: whether Fabirc is enabled
def setup_jsc_ABI49_0_0!(react_native_path: "../node_modules/react-native", fabric_enabled: false)
    pod 'ABI49_0_0React-jsi', :path => "#{react_native_path}/ReactCommon/jsi", :project_name => 'ABI49_0_0'
    pod 'ABI49_0_0React-jsc', :path => "#{react_native_path}/ReactCommon/jsc", :project_name => 'ABI49_0_0'
    if fabric_enabled
        pod 'ABI49_0_0React-jsc/Fabric', :path => "#{react_native_path}/ReactCommon/jsc", :project_name => 'ABI49_0_0'
    end
end

# It sets up the Hermes and JSI pods.
#
# @parameter react_native_path: relative path to react-native
# @parameter fabric_enabled: whether Fabirc is enabled
def setup_hermes_ABI49_0_0!(react_native_path: "../node_modules/react-native", fabric_enabled: false)
    # The following captures the output of prepare_hermes for use in tests

    pod 'ABI49_0_0React-jsi', :path => "#{react_native_path}/ReactCommon/jsi", :project_name => 'ABI49_0_0'
    # This `:tag => hermestag` below is only to tell CocoaPods to update hermes-engine when React Native version changes.
    # We have custom logic to compute the source for hermes-engine. See sdks/hermes-engine/*
    hermestag_file = File.join(react_native_path, "sdks", ".hermesversion")
    hermestag = File.exist?(hermestag_file) ? File.read(hermestag_file).strip : ''

    if File.exist?("#{react_native_path}/sdks/hermes-engine/destroot")
      pod 'ABI49_0_0hermes-engine', :path => "#{react_native_path}/sdks/hermes-engine", :project_name => 'ABI49_0_0', :tag => 'hermes-2023-03-20-RNv0.72.0-49794cfc7c81fb8f69fd60c3bbf85a7480cc5a77'
    else
      pod 'ABI49_0_0hermes-engine', :podspec => "#{react_native_path}/sdks/hermes-engine/ABI49_0_0hermes-engine.podspec", :project_name => 'ABI49_0_0', :tag => 'hermes-2023-03-20-RNv0.72.0-49794cfc7c81fb8f69fd60c3bbf85a7480cc5a77'
    end
    pod 'ABI49_0_0React-hermes', :path => "#{react_native_path}/ReactCommon/hermes", :project_name => 'ABI49_0_0'
    pod 'libevent', '~> 2.1.12'
end
