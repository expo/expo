# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require_relative './utils.rb'

# It sets up the JavaScriptCore and JSI pods.
#
# @parameter react_native_path: relative path to react-native
# @parameter fabric_enabled: whether Fabirc is enabled
def setup_jsc_ABI48_0_0!(react_native_path: "../node_modules/react-native", fabric_enabled: false)
    pod 'ABI48_0_0React-jsi', :path => "#{react_native_path}/ReactCommon/jsi", :project_name => 'ABI48_0_0'
    pod 'ABI48_0_0React-jsc', :path => "#{react_native_path}/ReactCommon/jsc", :project_name => 'ABI48_0_0'
    if fabric_enabled
        pod 'ABI48_0_0React-jsc/Fabric', :path => "#{react_native_path}/ReactCommon/jsc", :project_name => 'ABI48_0_0'
    end
end

# It sets up the Hermes and JSI pods.
#
# @parameter react_native_path: relative path to react-native
# @parameter fabric_enabled: whether Fabirc is enabled
def setup_hermes_ABI48_0_0!(react_native_path: "../node_modules/react-native", fabric_enabled: false)
    # The following captures the output of prepare_hermes for use in tests

    pod 'ABI48_0_0React-jsi', :path => "#{react_native_path}/ReactCommon/jsi", :project_name => 'ABI48_0_0'

    if File.exist?("#{react_native_path}/sdks/hermes-engine/destroot")
      pod 'ABI48_0_0hermes-engine', :path => "#{react_native_path}/sdks/hermes-engine", :project_name => 'ABI48_0_0'
    else
      pod 'ABI48_0_0hermes-engine', :podspec => "#{react_native_path}/sdks/hermes-engine/ABI48_0_0hermes-engine.podspec", :project_name => 'ABI48_0_0'
    end
    pod 'ABI48_0_0React-hermes', :path => "#{react_native_path}/ReactCommon/hermes", :project_name => 'ABI48_0_0'
    pod 'libevent', '~> 2.1.12'
end

def add_copy_hermes_framework_script_phase(installer, react_native_path)
    utils_dir = File.join(react_native_path, "sdks", "hermes-engine", "utils")
    phase_name = "[RN] Copy Hermes Framework"
    project = installer.generated_aggregate_targets.first.user_project
    target = project.targets.first
    if target.shell_script_build_phases.none? { |phase| phase.name == phase_name }
        phase = target.new_shell_script_build_phase(phase_name)
        phase.shell_script = ". #{utils_dir}/copy-hermes-xcode.sh"
        project.save()
    end
end

def remove_copy_hermes_framework_script_phase(installer, react_native_path)
    utils_dir = File.join(react_native_path, "sdks", "hermes-engine", "utils")
    phase_name = "[RN] Copy Hermes Framework"
    project = installer.generated_aggregate_targets.first.user_project
    target = project.native_targets.first
    target.shell_script_build_phases.each do |phase|
        if phase.name == phase_name
            target.build_phases.delete(phase)
        end
    end
    project.save()
end

def remove_hermesc_build_dir(react_native_path)
    %x(rm -rf #{react_native_path}/sdks/hermes-engine/build_host_hermesc)
end

def is_building_hermes_from_source(react_native_version, react_native_path)
    if ENV['HERMES_ENGINE_TARBALL_PATH'] != nil
        return false
    end

    isInMain = react_native_version.include?('1000.0.0')

    hermestag_file = File.join(react_native_path, "sdks", ".hermesversion")
    isInCI = ENV['REACT_NATIVE_CI'] === 'true'

    isReleaseBranch = File.exist?(hermestag_file) && isInCI


    return isInMain || isReleaseBranch
end
