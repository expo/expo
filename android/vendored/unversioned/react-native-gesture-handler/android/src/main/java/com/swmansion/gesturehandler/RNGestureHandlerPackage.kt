package com.swmansion.gesturehandler

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.swmansion.gesturehandler.BuildConfig
import com.swmansion.gesturehandler.react.RNGestureHandlerModule
import com.swmansion.gesturehandler.react.RNGestureHandlerRootViewManager
import com.swmansion.gesturehandler.react.RNGestureHandlerButtonViewManager

class RNGestureHandlerPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf<NativeModule>(RNGestureHandlerModule(reactContext))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext) =
    listOf<ViewManager<*, *>>(
      RNGestureHandlerRootViewManager(),
      RNGestureHandlerButtonViewManager())
}
