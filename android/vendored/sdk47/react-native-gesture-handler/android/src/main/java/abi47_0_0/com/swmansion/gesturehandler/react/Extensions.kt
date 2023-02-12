package abi47_0_0.com.swmansion.gesturehandler.react

import abi47_0_0.com.facebook.react.bridge.ReactContext
import abi47_0_0.com.facebook.react.modules.core.DeviceEventManagerModule
import abi47_0_0.com.facebook.react.uimanager.UIManagerModule

val ReactContext.deviceEventEmitter: DeviceEventManagerModule.RCTDeviceEventEmitter
  get() = this.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)

val ReactContext.UIManager: UIManagerModule
  get() = this.getNativeModule(UIManagerModule::class.java)!!
