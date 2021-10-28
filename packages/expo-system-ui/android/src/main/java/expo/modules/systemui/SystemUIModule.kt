package expo.modules.systemui


import android.app.Activity
import android.content.Context
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Build
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.appearance.AppearanceModule
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.errors.CurrentActivityNotFoundException
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.interfaces.constants.ConstantsInterface
import expo.modules.jsonutils.getNullable
import expo.modules.jsonutils.require
import expo.modules.systemui.helpers.setProtectedDeclaredField
import org.json.JSONException
import org.json.JSONObject

class SystemUIModule(context: Context) : ExportedModule(context) {

  private lateinit var activityProvider: ActivityProvider

  private lateinit var constantsInterface: ConstantsInterface

  private val appearance by lazy {
    (context as ReactContext)
      .getNativeModule(AppearanceModule::class.java)
  }

  override fun getName(): String {
    return NAME
  }

  // If there's no constants module, or app ownership isn't "expo", we're not in Expo Client.
  private val isScoped: Boolean
    get() {
      try {
        // If there's no constants module, or app ownership isn't "expo", we're not in Expo Client.
        return constantsInterface != null && "expo" == constantsInterface!!.appOwnership
      } catch (e: java.lang.Exception) {
        return false
      }
    }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    activityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
      ?: throw IllegalStateException("Could not find implementation for ActivityProvider.")
    constantsInterface = moduleRegistry.getModule(ConstantsInterface::class.java) ?: throw IllegalStateException("Could not find implementation for Constants.")

    // Only use the initial settings outside of sandboxes.
    if (isScoped) {
      return;
    }

    var manifestString = constantsInterface.constants.get("manifest").toString();
    val manifestJson = JSONObject(manifestString)

    // Lock the user interface style based on the manifest
    val userInterfaceStyle = getAndroidUserInterfaceStyle(manifestJson)
    updateUserInterfaceStyle(userInterfaceStyle)

    // Set the root view background color based on the manifest
    val rootViewBackgroundColor = getAndroidBackgroundColor(manifestJson)
    val activity = activityProvider.currentActivity

    if (activity == null) {
      Log.e(ERROR_TAG, "Failed to get the current Activity, skipping root view background color update")
    } else {
      setRootViewBackgroundColor(rootViewBackgroundColor, activity)
    }
  }

  private fun nightModeFromString(userInterfaceStyle: String?): Int {
    return if (userInterfaceStyle == null) {
      AppCompatDelegate.MODE_NIGHT_NO
    } else when (userInterfaceStyle) {
      "automatic" -> {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
          AppCompatDelegate.MODE_NIGHT_AUTO_BATTERY
        } else AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
      }
      "dark" -> AppCompatDelegate.MODE_NIGHT_YES
      "light" -> AppCompatDelegate.MODE_NIGHT_NO
      else -> AppCompatDelegate.MODE_NIGHT_NO
    }
  }

  private fun getAndroidBackgroundColor(root: JSONObject): String? {
    return try {
      root.require<JSONObject>("android").require("backgroundColor")
    } catch (e: JSONException) {
      root.getNullable("backgroundColor")
    }
  }

  private fun getAndroidUserInterfaceStyle(root: JSONObject): String? {
    return try {
      root.require<JSONObject>("android").require("userInterfaceStyle")
    } catch (e: JSONException) {
      root.getNullable("userInterfaceStyle")
    }
  }

  private fun setRootViewBackgroundColor(propColor: String?, activity: Activity) {
    activity.runOnUiThread {
      var rootView = activity.window.decorView
      var colorString = propColor
      if (colorString == null) {
        colorString = "#ffffff"
      }
      try {
        val color = Color.parseColor(colorString)
        rootView.setBackgroundColor(color)
      } catch (e: Throwable) {
        Log.e(ERROR_TAG, e.toString())
        rootView.setBackgroundColor(Color.WHITE)
      }
    }
  }

  private fun updateUserInterfaceStyle(propStyle: String?) {
    var style = propStyle;
    if (style == null || style == "") {
      style = "light"
    }

    // Update the UI mode in case it changed between reloads.
    AppCompatDelegate.setDefaultNightMode(nightModeFromString(style))

    if (style == "light" || style == "dark") {

      appearance?.let { appearanceModule ->
        try {
          appearanceModule::class.java.setProtectedDeclaredField(
            obj = appearanceModule,
            filedName = "mOverrideColorScheme",
            newValue = object : AppearanceModule.OverrideColorScheme {
              override fun getScheme(): String {
                return style
              }
            },
            predicate = { currentValue -> currentValue == null }
          )

          appearanceModule::class.java.setProtectedDeclaredField(
            obj = appearanceModule,
            filedName = "mColorScheme",
            newValue = style
          )

          // Update Appearance listeners
          appearanceModule.emitAppearanceChanged(style);

        } catch (e: Exception) {
          Log.e(ERROR_TAG, "Error overriding React Native Appearance module to match user interface style: $e")
        }
      }
    }
  }

  // Ensure that rejections are passed up to JS rather than terminating the native client.
  private fun safeRunOnUiThread(promise: Promise, block: (activity: Activity) -> Unit) {
    val activity = activityProvider.currentActivity
    if (activity == null) {
      promise.reject(CurrentActivityNotFoundException())
      return
    }
    activity.runOnUiThread {
      block(activity)
    }
  }

  @ExpoMethod
  fun setBackgroundColorAsync(color: Int, promise: Promise) {
    safeRunOnUiThread(promise) {
      setRootViewBackgroundColor(colorToHex(color), it)
    }
  }

  @ExpoMethod
  fun getBackgroundColorAsync(promise: Promise) {
    safeRunOnUiThread(promise) {
      var mBackground = it.window.decorView.background;
      if (mBackground is ColorDrawable) {
        promise.resolve(colorToHex((mBackground.mutate() as ColorDrawable).color))
      } else {
        promise.resolve(null);
      }
    }
  }

  companion object {
    private const val NAME = "ExpoSystemUI"
    private const val ERROR_TAG = "ERR_SYSTEM_UI"

    fun colorToHex(color: Int): String {
      return String.format("#%02x%02x%02x", Color.red(color), Color.green(color), Color.blue(color))
    }
  }
}
