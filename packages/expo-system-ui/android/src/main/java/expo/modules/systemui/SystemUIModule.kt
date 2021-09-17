package expo.modules.systemui

import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.os.Build
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.ExpoMethod

class SystemUIModule(context: Context) : ExportedModule(context) {

  private lateinit var mActivityProvider: ActivityProvider
  private val activity: Activity
    get() {
      return mActivityProvider.currentActivity ?: throw Error("Cannot get Main Activity")
    }

  override fun getName(): String {
    return NAME
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
  }

  @ExpoMethod
  fun getNavigationBarBackgroundColor(promise: Promise) {
    activity.runOnUiThread {
      val color = colorToHex(activity.window.navigationBarColor)
      promise.resolve(color)
    }
  }

  @ExpoMethod
  fun setNavigationBarBackgroundColor(color: Int, promise: Promise) {
    activity.runOnUiThread {
      activity.window.navigationBarColor = color
      promise.resolve(null)
    }
  }

  @ExpoMethod
  fun getNavigationBarDividerColor(promise: Promise) {
    activity.runOnUiThread {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        val color = colorToHex(activity.window.navigationBarDividerColor)
        promise.resolve(color)
      } else {
        promise.reject("unavailable", "'getNavigationBarDividerColor' is only available on Android API 28 or higher")
      }
    }
  }

  @ExpoMethod
  fun setNavigationBarDividerColor(color: Int, promise: Promise) {
    activity.runOnUiThread {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        activity.window.navigationBarDividerColor = color
        promise.resolve(null)
      } else {
        promise.reject("unavailable", "'setNavigationBarDividerColor' is only available on Android API 28 or higher")
      }
    }
  }

  @ExpoMethod
  fun getStatusBarBackgroundColor(promise: Promise) {
    activity.runOnUiThread {
      val color = colorToHex(activity.window.statusBarColor)
      promise.resolve(color)
    }
  }

  @ExpoMethod
  fun setStatusBarBackgroundColor(color: Int, promise: Promise) {
    activity.runOnUiThread {
      activity.window.statusBarColor = color
      promise.resolve(null)
    }
  }

  @ExpoMethod
  fun getStatusBarForegroundStyle(promise: Promise) {
    activity.runOnUiThread {
      WindowInsetsControllerCompat(activity.window, activity.window.decorView).let { controller ->
        val style = if (controller.isAppearanceLightStatusBars) "light" else "dark"
        promise.resolve(style)
      }
    }
  }

  @ExpoMethod
  fun setStatusBarForegroundStyle(style: String, promise: Promise) {
    activity.runOnUiThread {
      WindowInsetsControllerCompat(activity.window, activity.window.decorView).let { controller ->
        when (style) {
          "light" -> controller.isAppearanceLightStatusBars = false
          "dark" -> controller.isAppearanceLightStatusBars = true
          else -> {
            promise.reject("invalid-value", "Value \"$style\" is not a valid Status Bar foreground style")
            return@let
          }
        }
        promise.resolve(null)
      }
    }
  }

  @ExpoMethod
  fun getNavigationBarForegroundStyle(promise: Promise) {
    activity.runOnUiThread {
      WindowInsetsControllerCompat(activity.window, activity.window.decorView).let { controller ->
        val style = if (controller.isAppearanceLightNavigationBars) "light" else "dark"
        promise.resolve(style)
      }
    }
  }

  @ExpoMethod
  fun setNavigationBarForegroundStyle(style: String, promise: Promise) {
    activity.runOnUiThread {
      WindowInsetsControllerCompat(activity.window, activity.window.decorView).let { controller ->
        when (style) {
          "light" -> controller.isAppearanceLightNavigationBars = false
          "dark" -> controller.isAppearanceLightNavigationBars = true
          else -> {
            promise.reject("invalid-value", "Value \"$style\" is not a valid Navigation Bar foreground style")
            return@let
          }
        }
        promise.resolve(null)
      }
    }
  }

  @ExpoMethod
  fun setNavigationBarVisibility(visibility: String, promise: Promise) {
    activity.runOnUiThread {
      WindowInsetsControllerCompat(activity.window, activity.window.decorView).let { controller ->
        when (visibility) {
          "visible" -> {
            controller.show(WindowInsetsCompat.Type.navigationBars())
          }
          "hidden" -> {
            controller.hide(WindowInsetsCompat.Type.navigationBars())
          }
        }
      }
      promise.resolve(null)
    }
  }

  @ExpoMethod
  fun setStatusBarVisibility(visibility: String, promise: Promise) {
    activity.runOnUiThread {
      WindowInsetsControllerCompat(activity.window, activity.window.decorView).let { controller ->
        when (visibility) {
          "visible" -> {
            controller.show(WindowInsetsCompat.Type.statusBars())
          }
          "hidden" -> {
            controller.hide(WindowInsetsCompat.Type.statusBars())
          }
        }
      }
      promise.resolve(null)
    }
  }

  @ExpoMethod
  fun getAppearance(promise: Promise) {
    activity.runOnUiThread {
      val appearance = when (AppCompatDelegate.getDefaultNightMode()) {
        AppCompatDelegate.MODE_NIGHT_NO -> "light"
        AppCompatDelegate.MODE_NIGHT_YES -> "dark"
        AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM -> "auto"
        else -> "default"
      }
      promise.resolve(appearance)
    }
  }

  @ExpoMethod
  fun setAppearance(appearance: String, promise: Promise) {
    // FIXME(Marc): This crashes the App with an error from RNScreens:
    //    java.lang.IllegalStateException: Screen fragments should never be restored.
    //    Follow instructions from https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067 to properly configure your main activity.
    //  even though the Main Activity is configured correctly (`super.onCreate(null)`)
    //  as soon as this is fixed, we can expose it to JS again.
    activity.runOnUiThread {
      when (appearance) {
        "light" -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
        "dark" -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)
        "auto" -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM)
        "default" -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_UNSPECIFIED)
      }
      promise.resolve(null)
    }
  }

  @ExpoMethod
  fun setDrawsBehindSystemUI(drawsBehindSystemUI: Boolean, promise: Promise) {
    activity.runOnUiThread {
      WindowCompat.setDecorFitsSystemWindows(activity.window, !drawsBehindSystemUI)
      promise.resolve(null)
    }
  }

  @ExpoMethod
  fun getDrawsBehindSystemUI(promise: Promise) {
    activity.runOnUiThread {
      promise.resolve(!activity.window.decorView.fitsSystemWindows)
    }
  }

  @ExpoMethod
  fun setSystemUIBehavior(behavior: String, promise: Promise) {
    activity.runOnUiThread {
      WindowInsetsControllerCompat(activity.window, activity.window.decorView).let { controller ->
        controller.systemBarsBehavior = when (behavior) {
          "overlay-swipe" -> WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
          "inset-swipe" -> WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_SWIPE
          "inset-touch" -> WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_TOUCH
          else -> WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_TOUCH
        }
        promise.resolve(null)
      }
    }
  }

  @ExpoMethod
  fun getSystemUIBehavior(promise: Promise) {
    activity.runOnUiThread {
      WindowInsetsControllerCompat(activity.window, activity.window.decorView).let { controller ->
        val behavior = when (controller.systemBarsBehavior) {
          WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE -> "overlay-swipe"
          WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_SWIPE -> "inset-swipe"
          WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_TOUCH -> "inset-touch"
          else -> "inset-touch"
        }
        promise.resolve(behavior)
      }
    }
  }

  companion object {
    private const val NAME = "ExpoSystemUI"

    fun colorToHex(color: Int): String {
      return String.format("#%02x%02x%02x", Color.red(color), Color.green(color), Color.blue(color))
    }
  }
}
