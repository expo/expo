package expo.modules.updates

import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip

@DoNotStrip
class BSPatch private constructor() {
  @DoNotStrip
  private val mHybridData: HybridData

  init {
    mHybridData = initHybrid()
  }

  companion object {
    init {
      System.loadLibrary("expo-updates")
    }

    @JvmStatic
    @DoNotStrip
    external fun applyPatch(oldFilePath: String, newFilePath: String, patchFilePath: String): Int
  }

  @DoNotStrip
  private external fun initHybrid(): HybridData
}
