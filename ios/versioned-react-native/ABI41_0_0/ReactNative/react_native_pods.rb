# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

def use_react_native_ABI41_0_0! (options={})
  # The prefix to the react-native
  prefix = options[:path] ||= "../node_modules/react-native"

  # Include Fabric dependencies
  fabric_enabled = options[:fabric_enabled] ||= false

  # Include DevSupport dependency
  production = options[:production] ||= false

  # The Pods which should be included in all projects
  pod 'ABI41_0_0FBLazyVector', :path => "#{prefix}/Libraries/FBLazyVector", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0FBReactNativeSpec', :path => "#{prefix}/Libraries/FBReactNativeSpec", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0RCTRequired', :path => "#{prefix}/Libraries/RCTRequired", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0RCTTypeSafety', :path => "#{prefix}/Libraries/TypeSafety", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React', :path => "#{prefix}/", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React-Core', :path => "#{prefix}/", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React-CoreModules', :path => "#{prefix}/React/CoreModules", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React-RCTActionSheet', :path => "#{prefix}/Libraries/ActionSheetIOS", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React-RCTAnimation', :path => "#{prefix}/Libraries/NativeAnimation", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React-RCTBlob', :path => "#{prefix}/Libraries/Blob", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React-RCTImage', :path => "#{prefix}/Libraries/Image", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React-RCTLinking', :path => "#{prefix}/Libraries/LinkingIOS", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React-RCTNetwork', :path => "#{prefix}/Libraries/Network", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React-RCTSettings', :path => "#{prefix}/Libraries/Settings", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React-RCTText', :path => "#{prefix}/Libraries/Text", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React-RCTVibration', :path => "#{prefix}/Libraries/Vibration", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React-Core/RCTWebSocket', :path => "#{prefix}/", :project_name => 'ABI41_0_0'

  unless production
    pod 'ABI41_0_0React-Core/DevSupport', :path => "#{prefix}/", :project_name => 'ABI41_0_0'
  end

  pod 'ABI41_0_0React-cxxreact', :path => "#{prefix}/ReactCommon/cxxreact", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React-jsi', :path => "#{prefix}/ReactCommon/jsi", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React-jsiexecutor', :path => "#{prefix}/ReactCommon/jsiexecutor", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React-jsinspector', :path => "#{prefix}/ReactCommon/jsinspector", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0React-callinvoker', :path => "#{prefix}/ReactCommon/callinvoker", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0ReactCommon/turbomodule/core', :path => "#{prefix}/ReactCommon", :project_name => 'ABI41_0_0'
  pod 'ABI41_0_0Yoga', :path => "#{prefix}/ReactCommon/yoga", :project_name => 'ABI41_0_0', :modular_headers => true

  # pod 'ABI41_0_0DoubleConversion', :podspec => "#{prefix}/third-party-podspecs/DoubleConversion.podspec"
  # pod 'ABI41_0_0glog', :podspec => "#{prefix}/third-party-podspecs/glog.podspec"
  # pod 'ABI41_0_0Folly', :podspec => "#{prefix}/third-party-podspecs/Folly.podspec"

  if fabric_enabled
    pod 'ABI41_0_0React-Fabric', :path => "#{prefix}/ReactCommon", :project_name => 'ABI41_0_0'
    pod 'ABI41_0_0React-graphics', :path => "#{prefix}/ReactCommon/fabric/graphics", :project_name => 'ABI41_0_0'
    pod 'ABI41_0_0React-jsi/Fabric', :path => "#{prefix}/ReactCommon/jsi", :project_name => 'ABI41_0_0'
    pod 'ABI41_0_0React-RCTFabric', :path => "#{prefix}/React", :project_name => 'ABI41_0_0'
    # pod 'ABI41_0_0Folly/Fabric', :podspec => "#{prefix}/third-party-podspecs/Folly.podspec"
  end
end

def use_flipper!(versions = {})
  versions['Flipper'] ||= '~> 0.41.1'
  versions['Flipper-DoubleConversion'] ||= '1.1.7'
  versions['Flipper-Folly'] ||= '~> 2.2'
  versions['Flipper-Glog'] ||= '0.3.6'
  versions['Flipper-PeerTalk'] ||= '~> 0.0.4'
  versions['Flipper-RSocket'] ||= '~> 1.1'
  pod 'ABI41_0_0FlipperKit', versions['Flipper'], :configuration => 'Debug'
  pod 'ABI41_0_0FlipperKit/FlipperKitLayoutPlugin', versions['Flipper'], :configuration => 'Debug'
  pod 'ABI41_0_0FlipperKit/SKIOSNetworkPlugin', versions['Flipper'], :configuration => 'Debug'
  pod 'ABI41_0_0FlipperKit/FlipperKitUserDefaultsPlugin', versions['Flipper'], :configuration => 'Debug'
  pod 'ABI41_0_0FlipperKit/FlipperKitReactPlugin', versions['Flipper'], :configuration => 'Debug'
  # List all transitive dependencies for FlipperKit pods
  # to avoid them being linked in Release builds
  pod 'ABI41_0_0Flipper', versions['Flipper'], :configuration => 'Debug'
  pod 'ABI41_0_0Flipper-DoubleConversion', versions['Flipper-DoubleConversion'], :configuration => 'Debug'
  pod 'ABI41_0_0Flipper-Folly', versions['Flipper-Folly'], :configuration => 'Debug'
  pod 'ABI41_0_0Flipper-Glog', versions['Flipper-Glog'], :configuration => 'Debug'
  pod 'ABI41_0_0Flipper-PeerTalk', versions['Flipper-PeerTalk'], :configuration => 'Debug'
  pod 'ABI41_0_0Flipper-RSocket', versions['Flipper-RSocket'], :configuration => 'Debug'
  pod 'ABI41_0_0FlipperKit/Core', versions['Flipper'], :configuration => 'Debug'
  pod 'ABI41_0_0FlipperKit/CppBridge', versions['Flipper'], :configuration => 'Debug'
  pod 'ABI41_0_0FlipperKit/FBCxxFollyDynamicConvert', versions['Flipper'], :configuration => 'Debug'
  pod 'ABI41_0_0FlipperKit/FBDefines', versions['Flipper'], :configuration => 'Debug'
  pod 'ABI41_0_0FlipperKit/FKPortForwarding', versions['Flipper'], :configuration => 'Debug'
  pod 'ABI41_0_0FlipperKit/FlipperKitHighlightOverlay', versions['Flipper'], :configuration => 'Debug'
  pod 'ABI41_0_0FlipperKit/FlipperKitLayoutTextSearchable', versions['Flipper'], :configuration => 'Debug'
  pod 'ABI41_0_0FlipperKit/FlipperKitNetworkPlugin', versions['Flipper'], :configuration => 'Debug'
end

# Post Install processing for Flipper
def flipper_post_install(installer)
  installer.pods_project.targets.each do |target|
    if target.name == 'YogaKit'
      target.build_configurations.each do |config|
        config.build_settings['SWIFT_VERSION'] = '4.1'
      end
    end
  end
end
