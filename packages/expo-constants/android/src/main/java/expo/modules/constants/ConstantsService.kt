package expo.modules.constants

import org.apache.commons.io.IOUtils

import expo.modules.core.interfaces.InternalModule
import expo.modules.interfaces.constants.ConstantsInterface

import android.os.Build
import android.util.Log
import android.content.Context

import java.io.FileNotFoundException
import java.lang.Exception
import java.nio.charset.StandardCharsets
import java.util.*

private val TAG = ConstantsService::class.java.simpleName
private const val CONFIG_FILE_NAME = "app.config"

open class ConstantsService(private val context: Context) : InternalModule, ConstantsInterface {
  var statusBarHeightInternal = context.resources.getIdentifier("status_bar_height", "dimen", "android")
    .takeIf { it > 0 }
    ?.let { (context.resources::getDimensionPixelSize)(it) }
    ?.let { pixels -> convertPixelsToDp(pixels.toFloat(), context) }
    ?: 0

  private val sessionId = UUID.randomUUID().toString()

  enum class ExecutionEnvironment(val string: String) {
    BARE("bare"),
    STANDALONE("standalone"),
    STORE_CLIENT("storeClient")
  }

  override fun getExportedInterfaces(): List<Class<*>> = listOf(ConstantsInterface::class.java)

  override fun getConstants(): Map<String, Any?> {
    return mutableMapOf(
      "sessionId" to sessionId,
      "executionEnvironment" to ExecutionEnvironment.BARE.string,
      "statusBarHeight" to statusBarHeightInternal,
      "deviceName" to deviceName,
      "systemFonts" to systemFonts,
      "systemVersion" to systemVersion,
      "manifest" to appConfig,
      "platform" to mapOf<String, Map<String, Any>>("android" to emptyMap())
    )
  }

  // Just use package name in vanilla React Native apps.
  override fun getAppScopeKey(): String? = context.packageName

  override fun getDeviceName(): String = Build.MODEL

  override fun getStatusBarHeight() = statusBarHeightInternal

  override fun getSystemVersion(): String = Build.VERSION.RELEASE

  // From https://github.com/dabit3/react-native-fonts
  override fun getSystemFonts() = listOf(
    "normal",
    "notoserif",
    "sans-serif",
    "sans-serif-light",
    "sans-serif-thin",
    "sans-serif-condensed",
    "sans-serif-medium",
    "serif",
    "Roboto",
    "monospace"
  )

  private val appConfig: String?
    get() {
      try {
        context.assets.open(CONFIG_FILE_NAME).use {
            stream ->
          return IOUtils.toString(stream, StandardCharsets.UTF_8)
        }
      } catch (e: FileNotFoundException) {
        // do nothing, expected in managed apps
      } catch (e: Exception) {
        Log.e(TAG, "Error reading embedded app config", e)
      }
      return null
    }

  companion object {
    private fun convertPixelsToDp(px: Float, context: Context): Int {
      val resources = context.resources
      val metrics = resources.displayMetrics
      val dp = px / (metrics.densityDpi / 160f)
      return dp.toInt()
    }
  }
}
