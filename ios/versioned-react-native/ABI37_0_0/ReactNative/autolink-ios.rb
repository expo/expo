def use_react_native_ABI37_0_0! (options={})

  # The prefix to the react-native
  prefix = options[:path] ||= "../node_modules/react-native"

  # Include Fabric dependencies
  fabric_enabled = options[:fabric_enabled] ||= false

  # Include DevSupport dependency
  production = options[:production] ||= false

  # The Pods which should be included in all projects
  pod 'ABI37_0_0FBLazyVector', :path => "#{prefix}/Libraries/FBLazyVector", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0FBReactNativeSpec', :path => "#{prefix}/Libraries/FBReactNativeSpec", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0RCTRequired', :path => "#{prefix}/Libraries/RCTRequired", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0RCTTypeSafety', :path => "#{prefix}/Libraries/TypeSafety", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0React', :path => "#{prefix}/", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0React-Core', :path => "#{prefix}/", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0React-CoreModules', :path => "#{prefix}/React/CoreModules", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0React-RCTActionSheet', :path => "#{prefix}/Libraries/ActionSheetIOS", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0React-RCTAnimation', :path => "#{prefix}/Libraries/NativeAnimation", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0React-RCTBlob', :path => "#{prefix}/Libraries/Blob", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0React-RCTImage', :path => "#{prefix}/Libraries/Image", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0React-RCTLinking', :path => "#{prefix}/Libraries/LinkingIOS", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0React-RCTNetwork', :path => "#{prefix}/Libraries/Network", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0React-RCTSettings', :path => "#{prefix}/Libraries/Settings", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0React-RCTText', :path => "#{prefix}/Libraries/Text", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0React-RCTVibration', :path => "#{prefix}/Libraries/Vibration", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0React-Core/RCTWebSocket', :path => "#{prefix}/", :project_name => 'ABI37_0_0'

  unless production
    pod 'ABI37_0_0React-Core/DevSupport', :path => "#{prefix}/", :project_name => 'ABI37_0_0'
  end

  pod 'ABI37_0_0React-cxxreact', :path => "#{prefix}/ReactCommon/cxxreact", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0React-jsi', :path => "#{prefix}/ReactCommon/jsi", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0React-jsiexecutor', :path => "#{prefix}/ReactCommon/jsiexecutor", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0React-jsinspector', :path => "#{prefix}/ReactCommon/jsinspector", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0ReactCommon/jscallinvoker', :path => "#{prefix}/ReactCommon", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0ReactCommon/turbomodule/core', :path => "#{prefix}/ReactCommon", :project_name => 'ABI37_0_0'
  pod 'ABI37_0_0Yoga', :path => "#{prefix}/ReactCommon/yoga", :project_name => 'ABI37_0_0'

  # pod 'ABI37_0_0DoubleConversion', :podspec => "#{prefix}/third-party-podspecs/DoubleConversion.podspec"
  # pod 'ABI37_0_0glog', :podspec => "#{prefix}/third-party-podspecs/glog.podspec"
  # pod 'ABI37_0_0Folly', :podspec => "#{prefix}/third-party-podspecs/Folly.podspec"

  if fabric_enabled
    pod 'ABI37_0_0React-Fabric', :path => "#{prefix}/ReactCommon", :project_name => 'ABI37_0_0'
    pod 'ABI37_0_0React-graphics', :path => "#{prefix}/ReactCommon/fabric/graphics", :project_name => 'ABI37_0_0'
    pod 'ABI37_0_0React-jsi/Fabric', :path => "#{prefix}/ReactCommon/jsi", :project_name => 'ABI37_0_0'
    pod 'ABI37_0_0React-RCTFabric', :path => "#{prefix}/React", :project_name => 'ABI37_0_0'
    # pod 'ABI37_0_0Folly/Fabric', :podspec => "#{prefix}/third-party-podspecs/Folly.podspec"
  end

end
