package abi44_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import abi44_0_0.com.facebook.react.ReactPackage
import abi44_0_0.com.facebook.react.bridge.NativeModule
import abi44_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi44_0_0.com.facebook.react.uimanager.ViewManager

class StripeSdkPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf<NativeModule>(StripeSdkModule(reactContext))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return listOf<ViewManager<*, *>>(StripeSdkCardViewManager(), AuBECSDebitFormViewManager(), StripeContainerManager(), CardFormViewManager())
  }
}
