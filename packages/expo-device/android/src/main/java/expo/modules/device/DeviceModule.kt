package expo.modules.device

import android.app.ActivityManager
import android.app.UiModeManager
import android.content.Context
import android.content.res.Configuration
import android.graphics.Rect
import android.os.Build
import android.os.SystemClock
import android.provider.Settings
import android.util.DisplayMetrics
import android.view.WindowManager
import com.facebook.device.yearclass.YearClass
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import kotlin.math.pow
import kotlin.math.sqrt


class DeviceModule : Module() {
  // Keep this enum in sync with JavaScript
  enum class DeviceType(val JSValue: Int) {
    UNKNOWN(0),
    PHONE(1),
    TABLET(2),
    DESKTOP(3),
    TV(4)
  }

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoDevice")

    Constant("isDevice") {
      !isRunningOnEmulator
    }

    Constant("brand") {
      Build.BRAND
    }

    Constant("manufacturer") {
      Build.MANUFACTURER
    }

    Constant("modelName") {
      Build.MODEL
    }

    Constant("designName") {
      Build.DEVICE
    }

    Constant("productName") {
      Build.PRODUCT
    }

    Constant("deviceYearClass") {
      deviceYearClass
    }

    Constant("totalMemory") {
      val memoryInfo = ActivityManager.MemoryInfo()
      (context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager).getMemoryInfo(memoryInfo)
      memoryInfo.totalMem
    }

    Constant("deviceType") {
      getDeviceType(context).JSValue
    }

    Constant("supportedCpuArchitectures") {
      Build.SUPPORTED_ABIS?.takeIf { it.isNotEmpty() }
    }

    Constant("osName") {
      systemName
    }

    Constant("osVersion") {
      Build.VERSION.RELEASE
    }

    Constant("osBuildId") {
      Build.DISPLAY
    }

    Constant("osInternalBuildId") {
      Build.ID
    }

    Constant("osBuildFingerprint") {
      Build.FINGERPRINT
    }

    Constant("platformApiLevel") {
      Build.VERSION.SDK_INT
    }

    Constant("deviceName") {
      if (Build.VERSION.SDK_INT <= 31) {
        Settings.Secure.getString(context.contentResolver, "bluetooth_name")
      } else {
        Settings.Global.getString(context.contentResolver, Settings.Global.DEVICE_NAME)
      }
    }

    AsyncFunction<Int>("getDeviceTypeAsync") {
      return@AsyncFunction getDeviceType(context).JSValue
    }

    AsyncFunction<Double>("getUptimeAsync") {
      return@AsyncFunction SystemClock.uptimeMillis().toDouble()
    }

    AsyncFunction<Double>("getMaxMemoryAsync") {
      val maxMemory = Runtime.getRuntime().maxMemory()
      return@AsyncFunction if (maxMemory != Long.MAX_VALUE) maxMemory.toDouble() else -1.0
    }

    AsyncFunction<Boolean>("isRootedExperimentalAsync") {
      val isRooted: Boolean
      val isDevice = !isRunningOnEmulator

      val buildTags = Build.TAGS
      isRooted = if (isDevice && buildTags != null && buildTags.contains("test-keys")) {
        true
      } else {
        if (File("/system/app/Superuser.apk").exists()) {
          true
        } else {
          isDevice && File("/system/xbin/su").exists()
        }
      }

      return@AsyncFunction isRooted
    }

    AsyncFunction<Boolean>("isSideLoadingEnabledAsync") {
      return@AsyncFunction if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        @Suppress("DEPRECATION")
        Settings.Global.getInt(
          context.applicationContext.contentResolver,
          Settings.Global.INSTALL_NON_MARKET_APPS,
          0
        ) == 1
      } else {
        context.applicationContext.packageManager.canRequestPackageInstalls()
      }
    }

    AsyncFunction<List<String>>("getPlatformFeaturesAsync") {
      val allFeatures = context.applicationContext.packageManager.systemAvailableFeatures
      return@AsyncFunction allFeatures.filterNotNull().map { it.name }
    }

    AsyncFunction("hasPlatformFeatureAsync") { feature: String ->
      return@AsyncFunction context.applicationContext.packageManager.hasSystemFeature(feature)
    }

    /**
     * getCameraCutoutInfoAsync
     *
     * Returns camera-cutout-only information (focused on camera notch / cutout geometry).
     *
     * {
     *   hasCameraCutout: Boolean,
     *   cameraRects: [ { x, y, width, height, radius? } ],
     *   safeInsets: { top, bottom, left, right }
     * }
     *
     * Implementation notes:
     * - For API 28+ we get bounding rects and safe insets from DisplayCutout.
     * - We heuristically filter rects that appear at/near the top safe inset (these are likely camera cutouts).
     * - radius is left null (Android does not expose corner radius on DisplayCutout).
     */
    AsyncFunction("getCameraCutoutInfoAsync") {
      val activity = appContext.currentActivity

      // If no activity, return safe default
      if (activity == null) {
        return@AsyncFunction mapOf(
          "hasCameraCutout" to false,
          "cameraRects" to emptyList<Map<String, Any?>>(),
          "safeInsets" to mapOf("top" to 0, "bottom" to 0, "left" to 0, "right" to 0)
        )
      }

      // API 28+ - use DisplayCutout
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        try {
          val window = activity.window
          val rootInsets = window?.decorView?.rootWindowInsets
          if (rootInsets != null) {
            val displayCutout = rootInsets.displayCutout

            val safeTop = displayCutout?.safeInsetTop ?: rootInsets.systemWindowInsetTop
            val safeBottom = displayCutout?.safeInsetBottom ?: rootInsets.systemWindowInsetBottom
            val safeLeft = displayCutout?.safeInsetLeft ?: rootInsets.systemWindowInsetLeft
            val safeRight = displayCutout?.safeInsetRight ?: rootInsets.systemWindowInsetRight

            val safeInsetsMap = mapOf(
              "top" to safeTop,
              "bottom" to safeBottom,
              "left" to safeLeft,
              "right" to safeRight
            )

            val cameraRectsList = mutableListOf<Map<String, Any?>>()

            if (displayCutout != null) {
              val rects = displayCutout.boundingRects
              if (rects != null && rects.isNotEmpty()) {
                // Heuristic: camera cutouts usually appear at the top of the screen.
                // We consider a rect to be a camera cutout when its top is within the top safe inset region.
                // This avoids including side cutouts or other irregular cutouts.
                rects.forEach { rect: Rect ->
                  // if the rect is near the top area (inside or touching the top safe inset),
                  // treat it as camera cutout.
                  val isTopRect = rect.top <= safeTop && rect.bottom <= (safeTop + rect.height() * 2)
                  val topProximity = rect.top <= safeTop + 4 // allow small tolerance (px)
                  if (isTopRect || topProximity) {
                    cameraRectsList.add(
                      mapOf(
                        "x" to rect.left,
                        "y" to rect.top,
                        "width" to rect.width(),
                        "height" to rect.height(),
                        "radius" to null // Android doesn't provide radius here
                      )
                    )
                  }
                }
              }
            }

            val hasCameraCutout = cameraRectsList.isNotEmpty()
            return@AsyncFunction mapOf(
              "hasCameraCutout" to hasCameraCutout,
              "cameraRects" to cameraRectsList,
              "safeInsets" to safeInsetsMap
            )
          }
        } catch (e: Exception) {
          // swallow and fallback below
        }
      }

      // Fallback for < API 28 or when insets are unavailable:
      // estimate via resources (status/navigation bar heights) — but no camera cutout info.
      val resources = context.resources
      val statusBarId = resources.getIdentifier("status_bar_height", "dimen", "android")
      val statusBarHeight = if (statusBarId > 0) resources.getDimensionPixelSize(statusBarId) else 0
      val navBarId = resources.getIdentifier("navigation_bar_height", "dimen", "android")
      val navBarHeight = if (navBarId > 0) resources.getDimensionPixelSize(navBarId) else 0

      return@AsyncFunction mapOf(
        "hasCameraCutout" to false,
        "cameraRects" to emptyList<Map<String, Any?>>(),
        "safeInsets" to mapOf("top" to statusBarHeight, "bottom" to navBarHeight, "left" to 0, "right" to 0)
      )
    }
  }

  private val deviceYearClass: Int
    get() = YearClass.get(context)

  private val systemName: String
    get() {
      return Build.VERSION.BASE_OS.takeIf { it.isNotEmpty() } ?: "Android"
    }

  companion object {
    private val isRunningOnEmulator: Boolean
      get() = EmulatorUtilities.isRunningOnEmulator()

    private fun getDeviceType(context: Context): DeviceType {
      // Detect TVs via UI mode (Android TVs) or system features (Fire TV).
      if (context.applicationContext.packageManager.hasSystemFeature("amazon.hardware.fire_tv")) {
        return DeviceType.TV
      }

      val uiManager = context.getSystemService(Context.UI_MODE_SERVICE) as UiModeManager?
      if (uiManager != null && uiManager.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION) {
        return DeviceType.TV
      }

      val deviceTypeFromResourceConfiguration = getDeviceTypeFromResourceConfiguration(context)
      return if (deviceTypeFromResourceConfiguration != DeviceType.UNKNOWN) {
        deviceTypeFromResourceConfiguration
      } else {
        getDeviceTypeFromPhysicalSize(context)
      }
    }

    // Device type based on the smallest screen width quantifier
    // https://developer.android.com/guide/topics/resources/providing-resources#SmallestScreenWidthQualifier
    private fun getDeviceTypeFromResourceConfiguration(context: Context): DeviceType {
      val smallestScreenWidthDp = context.resources.configuration.smallestScreenWidthDp

      return if (smallestScreenWidthDp == Configuration.SMALLEST_SCREEN_WIDTH_DP_UNDEFINED) {
        DeviceType.UNKNOWN
      } else if (smallestScreenWidthDp >= 600) {
        DeviceType.TABLET
      } else {
        DeviceType.PHONE
      }
    }

    private fun getDeviceTypeFromPhysicalSize(context: Context): DeviceType {
      // Find the current window manager, if none is found we can't measure the device physical size.
      val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager?
        ?: return DeviceType.UNKNOWN

      // Get display metrics to see if we can differentiate phones and tablets.
      val widthInches: Double
      val heightInches: Double

      // windowManager.defaultDisplay was marked as deprecated in API level 30 (Android R) and above
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val windowBounds = windowManager.currentWindowMetrics.bounds
        val densityDpi = context.resources.configuration.densityDpi
        widthInches = windowBounds.width() / densityDpi.toDouble()
        heightInches = windowBounds.height() / densityDpi.toDouble()
      } else {
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay.getRealMetrics(metrics)
        widthInches = metrics.widthPixels / metrics.xdpi.toDouble()
        heightInches = metrics.heightPixels / metrics.ydpi.toDouble()
      }

      // Calculate physical size.
      val diagonalSizeInches = sqrt(widthInches.pow(2.0) + heightInches.pow(2.0))

      return if (diagonalSizeInches in 3.0..6.9) {
        // Devices in a sane range for phones are considered to be phones.
        DeviceType.PHONE
      } else if (diagonalSizeInches > 6.9 && diagonalSizeInches <= 18.0) {
        // Devices larger than a phone and in a sane range for tablets are tablets.
        DeviceType.TABLET
      } else {
        // Otherwise, we don't know what device type we're on.
        DeviceType.UNKNOWN
      }
    }
  }
}
