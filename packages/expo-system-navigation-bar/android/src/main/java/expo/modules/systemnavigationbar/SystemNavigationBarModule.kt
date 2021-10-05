package expo.modules.systemnavigationbar

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
import expo.modules.core.interfaces.services.EventEmitter

class SystemNavigationBarModule(context: Context) : ExportedModule(context) {

  private lateinit var mActivityProvider: ActivityProvider
  private val activity: Activity
    get() {
      return mActivityProvider.currentActivity ?: throw Error("Cannot get Main Activity")
    }

  override fun getName(): String {
    return NAME
  }
  private val VISIBILITY_EVENT_NAME = "Expo.visibilityDidChange"

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)

    val eventEmitter = moduleRegistry.getModule(EventEmitter::class.java)
    val decorView = window.decorView
    decorView.setOnSystemUiVisibilityChangeListener { visibility: Int ->
      eventEmitter.emit(
        VISIBILITY_EVENT_NAME,
        Bundle().apply {
          putInt("visibility", visibility,
          putBoolean("statusBar", (visibility & View.SYSTEM_UI_FLAG_FULLSCREEN) == 0),
          putBoolean("navigationBar", (visibility & View.SYSTEM_UI_FLAG_HIDE_NAVIGATION) == 0)
        }
      )
    }
  }

  @ExpoMethod
  fun getBackgroundColorAsync(promise: Promise) {
    activity.runOnUiThread {
      val color = colorToHex(activity.window.navigationBarColor)
      promise.resolve(color)
    }
  }

  @ExpoMethod
  fun setBackgroundColorAsync(color: Int, promise: Promise) {
    activity.runOnUiThread {
      activity.window.navigationBarColor = color
      promise.resolve(null)
    }
  }

  @ExpoMethod
  fun getBorderColorAsync(promise: Promise) {
    activity.runOnUiThread {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        val color = colorToHex(activity.window.navigationBarDividerColor)
        promise.resolve(color)
      } else {
        promise.reject("unavailable", "'getBorderColorAsync' is only available on Android API 28 or higher")
      }
    }
  }

  @ExpoMethod
  fun setBorderColorAsync(color: Int, promise: Promise) {
    activity.runOnUiThread {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        activity.window.navigationBarDividerColor = color
        promise.resolve(null)
      } else {
        promise.reject("unavailable", "'setBorderColorAsync' is only available on Android API 28 or higher")
      }
    }
  }

  @ExpoMethod
  fun getAppearanceAsync(promise: Promise) {
    activity.runOnUiThread {
      WindowInsetsControllerCompat(activity.window, activity.window.decorView).let { controller ->
        val style = if (controller.isAppearanceLightNavigationBars) "light" else "dark"
        promise.resolve(style)
      }
    }
  }

  @ExpoMethod
  fun setAppearanceAsync(style: String, promise: Promise) {
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
  fun setVisibilityAsync(visibility: String, promise: Promise) {
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
  fun setPositionAsync(position: String, promise: Promise) {
    var drawsBehindSystemUI = position == "absolute"
    activity.runOnUiThread {
      WindowCompat.setDecorFitsSystemWindows(activity.window, !drawsBehindSystemUI)
      promise.resolve(null)
    }
  }

  @ExpoMethod
  fun getPositionAsync(promise: Promise) {
    activity.runOnUiThread {
      if (activity.window.decorView.fitsSystemWindows) {
        promise.resolve("relative")
      } else {
        promise.resolve("absolute")
      }
    }
  }

  @ExpoMethod
  fun getBehaviorAsync(behavior: String, promise: Promise) {
    activity.runOnUiThread {
      WindowInsetsControllerCompat(activity.window, activity.window.decorView).let { controller ->
        controller.systemBarsBehavior = when (behavior) {
          // TODO: Maybe relative / absolute
          "overlay-swipe" -> WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
          "inset-swipe" -> WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_SWIPE
          // Default "inset-touch" 
          else -> WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_TOUCH
        }
        promise.resolve(null)
      }
    }
  }

  @ExpoMethod
  fun getBehaviorAsync(promise: Promise) {
    activity.runOnUiThread {
      WindowInsetsControllerCompat(activity.window, activity.window.decorView).let { controller ->
        val behavior = when (controller.systemBarsBehavior) {
          // TODO: Maybe relative / absolute
          WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE -> "overlay-swipe"
          WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_SWIPE -> "inset-swipe"
          // WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_TOUCH -> "inset-touch"
          else -> "inset-touch"
        }
        promise.resolve(behavior)
      }
    }
  }

  companion object {
    private const val NAME = "ExpoSystemNavigationBar"

    fun colorToHex(color: Int): String {
      return String.format("#%02x%02x%02x", Color.red(color), Color.green(color), Color.blue(color))
    }
  }
}
