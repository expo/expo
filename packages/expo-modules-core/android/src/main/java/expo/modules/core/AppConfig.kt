package expo.modules.core

import android.content.Context
import android.util.Log

import org.apache.commons.io.IOUtils

import java.io.FileNotFoundException
import java.nio.charset.StandardCharsets

object AppConfig {
  private val TAG = AppConfig::class.java.simpleName
  private const val CONFIG_FILE_NAME = "app.config"

  private var config: String? = null

  private fun impl(context: Context): String? {
    if (config != null) {
      return config // Only read config once
    }

    try {
      context.assets.open(CONFIG_FILE_NAME).use {
          stream ->
        config = IOUtils.toString(stream, StandardCharsets.UTF_8)
        return config
      }
    } catch (e: FileNotFoundException) {
      // do nothing, expected in managed apps
    } catch (e: Exception) {
      Log.e(TAG, "Error reading embedded app config", e)
    }

    return null
  }

  @JvmStatic
  fun get(context: Context): String? = impl(context)
}
