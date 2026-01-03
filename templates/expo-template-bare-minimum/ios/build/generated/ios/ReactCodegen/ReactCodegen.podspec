# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

version = "0.83.1"
source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

use_frameworks = ENV['USE_FRAMEWORKS'] != nil
folly_compiler_flags = Helpers::Constants.folly_config[:compiler_flags]
boost_compiler_flags = Helpers::Constants.boost_config[:compiler_flags]

header_search_paths = []
framework_search_paths = []

header_search_paths = [
  "\"$(PODS_ROOT)/ReactNativeDependencies\"",
  "\"${PODS_ROOT}/Headers/Public/ReactCodegen/react/renderer/components\"",
  "\"$(PODS_ROOT)/Headers/Private/React-Fabric\"",
  "\"$(PODS_ROOT)/Headers/Private/React-RCTFabric\"",
  "\"$(PODS_ROOT)/Headers/Private/Yoga\"",
  "\"$(PODS_TARGET_SRCROOT)\"",
]

if use_frameworks
  ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-Fabric", "React_Fabric", ["react/renderer/components/view/platform/cxx"])
    .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-FabricImage", "React_FabricImage", []))
    .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-graphics", "React_graphics", ["react/renderer/graphics/platform/ios"]))
    .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "ReactCommon", "ReactCommon", ["react/nativemodule/core"]))
    .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-runtimeexecutor", "React_runtimeexecutor", ["platform/ios"]))
    .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-NativeModulesApple", "React_NativeModulesApple", []))
    .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-RCTFabric", "RCTFabric", []))
    .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-debug", "React_debug", []))
    .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-rendererdebug", "React_rendererdebug", []))
    .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-utils", "React_utils", []))
    .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-featureflags", "React_featureflags", []))
    .each { |search_path|
      header_search_paths << "\"#{search_path}\""
    }
  end

Pod::Spec.new do |s|
  s.name                = "ReactCodegen"
  s.version             = version
  s.summary             = 'Temp pod for generated files for React Native'
  s.homepage            = 'https://facebook.com/'
  s.license             = 'Unlicense'
  s.authors             = 'Facebook'
  s.compiler_flags      = "#{folly_compiler_flags} #{boost_compiler_flags} -Wno-nullability-completeness -std=c++20"
  s.source              = { :git => '' }
  s.header_mappings_dir = './'
  s.platforms           = min_supported_versions
  s.source_files        = "**/*.{h,mm,cpp}"
  s.exclude_files       = "RCTAppDependencyProvider.{h,mm}" # these files are generated in the same codegen path but needs to belong to a different pod
  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => header_search_paths.join(' '),
    "FRAMEWORK_SEARCH_PATHS" => framework_search_paths,
    "OTHER_CPLUSPLUSFLAGS" => "$(inherited) #{folly_compiler_flags} #{boost_compiler_flags}"
  }

  s.dependency "React-jsiexecutor"
  s.dependency "RCTRequired"
  s.dependency "RCTTypeSafety"
  s.dependency "React-Core"
  s.dependency "React-jsi"
  s.dependency "ReactCommon/turbomodule/bridging"
  s.dependency "ReactCommon/turbomodule/core"
  s.dependency "React-NativeModulesApple"
  s.dependency 'React-graphics'
  s.dependency 'React-rendererdebug'
  s.dependency 'React-Fabric'
  s.dependency 'React-FabricImage'
  s.dependency 'React-debug'
  s.dependency 'React-utils'
  s.dependency 'React-featureflags'
  s.dependency 'React-RCTAppDelegate'

  depend_on_js_engine(s)
  add_rn_third_party_dependencies(s)
  add_rncore_dependency(s)

  s.script_phases = {
    'name' => 'Generate Specs',
    'execution_position' => :before_compile,
    'input_files' => [],
    'show_env_vars_in_log' => true,
    'output_files' => ["${DERIVED_FILE_DIR}/react-codegen.log"],
    'script': <<-SCRIPT
pushd "$PODS_ROOT/../" > /dev/null
RCT_SCRIPT_POD_INSTALLATION_ROOT=$(pwd)
popd >/dev/null

export RCT_SCRIPT_RN_DIR="$RCT_SCRIPT_POD_INSTALLATION_ROOT/../../../node_modules/react-native"
export RCT_SCRIPT_APP_PATH="$RCT_SCRIPT_POD_INSTALLATION_ROOT/.."
export RCT_SCRIPT_OUTPUT_DIR="$RCT_SCRIPT_POD_INSTALLATION_ROOT"
export RCT_SCRIPT_TYPE="withCodegenDiscovery"

export SCRIPT_PHASES_SCRIPT="$RCT_SCRIPT_RN_DIR/scripts/react_native_pods_utils/script_phases.sh"
export WITH_ENVIRONMENT="$RCT_SCRIPT_RN_DIR/scripts/xcode/with-environment.sh"
/bin/sh -c '"$WITH_ENVIRONMENT" "$SCRIPT_PHASES_SCRIPT"'
SCRIPT
  }

end
