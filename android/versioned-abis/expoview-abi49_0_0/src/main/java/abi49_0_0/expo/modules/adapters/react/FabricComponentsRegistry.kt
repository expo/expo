// Copyright 2018-present 650 Industries. All rights reserved.

package abi49_0_0.expo.modules.adapters.react

import com.facebook.jni.HybridData
import abi49_0_0.com.facebook.react.uimanager.ViewManager
import com.facebook.soloader.SoLoader
import abi49_0_0.expo.modules.core.interfaces.DoNotStrip

@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class FabricComponentsRegistry(viewManagerList: List<ViewManager<*, *>>) {
  private val componentNames: List<String>

  @DoNotStrip
  private val mHybridData: HybridData

  init {
    componentNames = viewManagerList.map { it.name }
    mHybridData = initHybrid()
    registerComponentsRegistry(componentNames.toTypedArray())
  }

  private external fun initHybrid(): HybridData
  private external fun registerComponentsRegistry(componentNames: Array<String>)

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }

  companion object {
    init {
      SoLoader.loadLibrary("expo-modules-core_abi49_0_0")
    }
  }
}
