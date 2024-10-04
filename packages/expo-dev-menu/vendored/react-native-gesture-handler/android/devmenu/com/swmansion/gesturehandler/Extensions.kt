package devmenu.com.swmansion.gesturehandler

import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.uimanager.UIManagerModule

val ReactContext.deviceEventEmitter: DeviceEventManagerModule.RCTDeviceEventEmitter
    get() = this.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)

val ReactContext.UIManager: UIManagerModule
    get() = this.getNativeModule(UIManagerModule::class.java)!!
