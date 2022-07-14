package abi46_0_0.host.exp.exponent.modules.api.screens

import abi46_0_0.com.facebook.react.ReactPackage
import abi46_0_0.com.facebook.react.bridge.NativeModule
import abi46_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi46_0_0.com.facebook.react.uimanager.ViewManager
import com.facebook.soloader.SoLoader

import host.exp.expoview.BuildConfig

class RNScreensPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // For Fabric, we load c++ native library here, this triggers screen's Fabric
      // component registration which is necessary in order to avoid asking users
      // to manually add init calls in their application code.
      // This should no longer be needed if RN's autolink mechanism has Fabric support
      SoLoader.loadLibrary("rnscreens_modules")
    }
    return emptyList<NativeModule>()
  }

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
