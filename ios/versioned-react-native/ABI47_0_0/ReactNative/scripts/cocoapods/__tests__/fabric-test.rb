# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require_relative "../fabric.rb"
require_relative "./test_utils/podSpy.rb"

class FabricTest < Test::Unit::TestCase

    def setup
        podSpy_cleanUp()
    end

    def test_setupFabric_installsPods
        # Arrange
        prefix = "../.."

        # Act
        setup_fabric!(prefix)

        # Assert
        check_installed_pods(prefix)
    end

    def check_installed_pods(prefix)
        assert_equal($podInvocationCount, 6)

        check_pod("React-Fabric", :path => "#{prefix}/ReactCommon", :project_name => 'ABI47_0_0')
        check_pod("React-rncore", :path => "#{prefix}/ReactCommon", :project_name => 'ABI47_0_0')
        check_pod("React-graphics", :path => "#{prefix}/ReactCommon/react/renderer/graphics", :project_name => 'ABI47_0_0')
        check_pod("React-jsi/Fabric", :path => "#{prefix}/ReactCommon/jsi", :project_name => 'ABI47_0_0')
        check_pod("React-RCTFabric", :path => "#{prefix}/React", :project_name => 'ABI47_0_0', :modular_headers => true)
        check_pod("RCT-Folly/Fabric", :podspec => "#{prefix}/third-party-podspecs/RCT-Folly.podspec")
    end

    def check_pod(name, path: nil, modular_headers: nil, podspec: nil)
        params = $podInvocation[name]
        expected_params = {}

        if path != nil then expected_params[:path] = path end
        if modular_headers != nil then expected_params[:modular_headers] = modular_headers end
        if podspec != nil then expected_params[:podspec] = podspec end

        assert_equal(params, expected_params)
    end

end
