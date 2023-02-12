package abi46_0_0.com.shopify.reactnative.flash_list

import abi46_0_0.com.facebook.react.ReactPackage
import abi46_0_0.com.facebook.react.bridge.NativeModule
import abi46_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi46_0_0.com.facebook.react.uimanager.ViewManager

class ReactNativeFlashListPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf()
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return listOf(
        AutoLayoutViewManager(),
        CellContainerManager()
    )
  }
}
