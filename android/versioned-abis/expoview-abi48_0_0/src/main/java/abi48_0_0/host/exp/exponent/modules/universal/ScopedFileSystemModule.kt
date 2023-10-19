package abi48_0_0.host.exp.exponent.modules.universal

import android.content.Context
import abi48_0_0.expo.modules.filesystem.FileSystemModule

class ScopedFileSystemModule(context: Context) : FileSystemModule(context) {
  override fun getConstants(): Map<String, Any?> {
    return super.getConstants().toMutableMap().apply {
      this["bundledAssets"] = getBundledAssets()
    }
  }

  private fun getBundledAssets(): List<String>? {
    // Expo Go does not support bundled assets.
    return null
  }
}
