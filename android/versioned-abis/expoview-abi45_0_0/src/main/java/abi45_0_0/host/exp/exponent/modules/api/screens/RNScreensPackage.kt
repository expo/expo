package abi45_0_0.host.exp.exponent.modules.api.screens

import abi45_0_0.com.facebook.react.ReactPackage
import abi45_0_0.com.facebook.react.bridge.NativeModule
import abi45_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi45_0_0.com.facebook.react.uimanager.ViewManager

class RNScreensPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext) =
    emptyList<NativeModule>()

  override fun createViewManagers(reactContext: ReactApplicationContext) =
    listOf<ViewManager<*, *>>(
      ScreenContainerViewManager(),
      ScreenViewManager(),
      ScreenStackViewManager(),
      ScreenStackHeaderConfigViewManager(),
      ScreenStackHeaderSubviewManager(),
      SearchBarManager()
    )
}
