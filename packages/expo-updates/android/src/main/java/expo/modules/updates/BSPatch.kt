package expo.modules.updates

import com.facebook.jni.annotations.DoNotStrip

@DoNotStrip
object BSPatch {
  init {
    System.loadLibrary("expo-updates")
  }

  @JvmStatic
  @DoNotStrip
  external fun applyPatch(oldFilePath: String, newFilePath: String, patchFilePath: String): Int
}
