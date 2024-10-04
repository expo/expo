package abi46_0_0.host.exp.exponent.modules.api.components.gesturehandler

import abi46_0_0.com.facebook.react.bridge.ReactContext
import abi46_0_0.com.facebook.react.modules.core.DeviceEventManagerModule
import abi46_0_0.com.facebook.react.uimanager.UIManagerModule

val ReactContext.deviceEventEmitter: DeviceEventManagerModule.RCTDeviceEventEmitter
  get() = this.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)

val ReactContext.UIManager: UIManagerModule
  get() = this.getNativeModule(UIManagerModule::class.java)!!
