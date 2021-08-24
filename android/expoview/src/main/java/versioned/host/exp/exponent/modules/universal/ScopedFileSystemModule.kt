package versioned.host.exp.exponent.modules.universal

import android.content.Context
import expo.modules.filesystem.FileSystemModule
import host.exp.exponent.Constants
import org.apache.commons.io.IOUtils
import org.json.JSONObject
import java.lang.Exception

class ScopedFileSystemModule(context: Context) : FileSystemModule(context) {
  override fun getConstants(): Map<String, Any> {
    return super.getConstants()!!.toMutableMap().apply {
      this["bundledAssets"] = getBundledAssets()
    }
  }

  private fun getBundledAssets(): List<String>? {
    return if (!Constants.isStandaloneApp()) {
      // Fastpath, only standalone apps support bundled assets.
      null
    } else try {
      val inputStream = context.assets.open(SHELL_APP_EMBEDDED_MANIFEST_PATH)
      val jsonString = IOUtils.toString(inputStream)
      val manifest = JSONObject(jsonString)
      val bundledAssetsJSON = manifest.getJSONArray("bundledAssets") ?: return null
      mutableListOf<String>().apply {
        for (i in 0 until bundledAssetsJSON.length()) {
          add(bundledAssetsJSON.getString(i))
        }
      }
    } catch (ex: Exception) {
      ex.printStackTrace()
      null
    }
  }

  companion object {
    private const val SHELL_APP_EMBEDDED_MANIFEST_PATH = "shell-app-manifest.json"
  }
}
