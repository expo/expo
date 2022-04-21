package abi45_0_0.expo.modules.random

import abi45_0_0.com.facebook.react.ReactPackage
import abi45_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi45_0_0.com.facebook.react.bridge.NativeModule
import abi45_0_0.com.facebook.react.uimanager.ViewManager

class RandomPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(RandomModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
