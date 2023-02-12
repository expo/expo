package abi47_0_0.host.exp.exponent.modules.universal

import android.content.Context
import abi47_0_0.expo.modules.filesystem.FileSystemModule
import host.exp.exponent.Constants
import org.apache.commons.io.IOUtils
import org.json.JSONObject
import java.lang.Exception

private const val SHELL_APP_EMBEDDED_MANIFEST_PATH = "shell-app-manifest.json"

class ScopedFileSystemModule(context: Context) : FileSystemModule(context) {
  override fun getConstants(): Map<String, Any?> {
    return super.getConstants().toMutableMap().apply {
      this["bundledAssets"] = getBundledAssets()
    }
  }

  private fun getBundledAssets(): List<String>? {
    return if (!Constants.isStandaloneApp()) {
      // Fastpath, only standalone apps support bundled assets.
      null
    } else try {
      context.assets.open(SHELL_APP_EMBEDDED_MANIFEST_PATH).use {
        val jsonString = IOUtils.toString(it)
        val manifest = JSONObject(jsonString)
        val bundledAssetsJSON = manifest.getJSONArray("bundledAssets") ?: return null
        mutableListOf<String>().apply {
          for (i in 0 until bundledAssetsJSON.length()) {
            add(bundledAssetsJSON.getString(i))
          }
        }
      }
    } catch (ex: Exception) {
      ex.printStackTrace()
      null
    }
  }
}
