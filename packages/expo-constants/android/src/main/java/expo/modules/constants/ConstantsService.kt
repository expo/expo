package expo.modules.constants

import android.content.Context
import android.os.Build
import android.util.Log
import expo.modules.interfaces.constants.ConstantsInterface
import expo.modules.kotlin.services.ServiceInterface
import java.io.FileNotFoundException
import java.util.UUID

private val TAG = ConstantsService::class.java.simpleName
private const val CONFIG_FILE_NAME = "app.config"

@ServiceInterface(ConstantsInterface::class)
open class ConstantsService(private val context: Context) : ConstantsInterface {
  var statusBarHeightInternal = context
    .resources
    .getIdentifier("status_bar_height", "dimen", "android")
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

  override val constants: Map<String, Any?>
    get() = mapOf(
      "sessionId" to sessionId,
      "executionEnvironment" to ExecutionEnvironment.BARE.string,
      "statusBarHeight" to statusBarHeightInternal,
      "deviceName" to deviceName,
      "systemFonts" to systemFonts,
      "systemVersion" to systemVersion,
      "manifest" to appConfig,
      "platform" to mapOf<String, Map<String, Any>>("android" to emptyMap())
    )

  // Just use package name in vanilla React Native apps.
  override val appScopeKey: String?
    get() = context.packageName

  override val deviceName: String
    get() = Build.MODEL

  override val statusBarHeight: Int
    get() = statusBarHeightInternal

  override val systemVersion: String
    get() = Build.VERSION.RELEASE

  // From https://github.com/dabit3/react-native-fonts
  override val systemFonts: List<String>
    get() = listOf(
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
        return context
          .assets
          .open(CONFIG_FILE_NAME)
          .use { input ->
            input
              .bufferedReader(charset = Charsets.UTF_8)
              .use { it.readText() }
          }
      } catch (_: FileNotFoundException) {
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
