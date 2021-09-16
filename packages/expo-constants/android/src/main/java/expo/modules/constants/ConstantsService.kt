package expo.modules.constants

import org.apache.commons.io.IOUtils

import com.facebook.device.yearclass.YearClass

import expo.modules.core.interfaces.InternalModule
import expo.modules.interfaces.constants.ConstantsInterface

import android.os.Build
import android.util.Log
import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager

import java.io.FileNotFoundException
import java.lang.Exception
import java.nio.charset.StandardCharsets
import java.util.*

private val TAG = ConstantsService::class.java.simpleName
private const val CONFIG_FILE_NAME = "app.config"

class ConstantsService(private val context: Context) : InternalModule, ConstantsInterface {
  private var statusBarHeight = 0
  private val sessionId = UUID.randomUUID().toString()
  private val exponentInstallationId: ExponentInstallationId = ExponentInstallationId(context)

  enum class ExecutionEnvironment(val string: String) {
    BARE("bare"),
    STANDALONE("standalone"),
    STORE_CLIENT("storeClient");
  }

  override fun getExportedInterfaces(): List<Class<*>> =
    listOf(ConstantsInterface::class.java as Class<*>)

  override fun getConstants(): Map<String, Any> {
    val platform: Map<String, Any> = mapOf("android" to hashMapOf<String, Any>(/* empty */))

    val constants: MutableMap<String, Any> = hashMapOf(
      "sessionId" to sessionId,
      "executionEnvironment" to ExecutionEnvironment.BARE.string,
      "statusBarHeight" to statusBarHeight,
      "deviceYearClass" to deviceYearClass,
      "deviceName" to deviceName,
      "isDevice" to isDevice,
      "systemFonts" to systemFonts,
      "systemVersion" to systemVersion,
      "installationId" to getOrCreateInstallationId,
      "manifest" to appConfig!!,
      "platform" to platform,
    )

    try {
      val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
      constants["nativeAppVersion"] = pInfo.versionName

      val versionCode = getLongVersionCode(pInfo).toInt()
      constants["nativeBuildVersion"] = versionCode.toString()
    } catch (e: PackageManager.NameNotFoundException) {
      Log.e(TAG, "Exception: ", e)
    }

    return constants
  }

  // Just use package name in vanilla React Native apps.
  override fun getAppScopeKey(): String = context.packageName

  override fun getAppOwnership() = "guest"

  override fun getDeviceName(): String = Build.MODEL

  override fun getDeviceYearClass() = YearClass.get(context)

  override fun getIsDevice() = !isRunningOnGenymotion && !isRunningOnStockEmulator

  override fun getStatusBarHeight() = statusBarHeight

  override fun getSystemVersion(): String = Build.VERSION.RELEASE

  val getOrCreateInstallationId: String
    get() = exponentInstallationId.orCreateUUID

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

    private val isRunningOnGenymotion: Boolean
      get() = Build.FINGERPRINT.contains("vbox")

    private val isRunningOnStockEmulator: Boolean
      get() = Build.FINGERPRINT.contains("generic")

    private fun getLongVersionCode(info: PackageInfo) =
      if (Build.VERSION.SDK_INT >= 28) info.longVersionCode
      else info.versionCode.toLong()
  }

  init {
    val resourceId = context.resources.getIdentifier("status_bar_height", "dimen", "android")
    if (resourceId > 0) {
      val statusBarHeightPixels = context.resources.getDimensionPixelSize(resourceId)
      // Convert from pixels to dip
      statusBarHeight = convertPixelsToDp(statusBarHeightPixels.toFloat(), context)
    }
  }
}
