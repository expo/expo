package expo.modules.navigationbar

import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsControllerCompat
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.errors.CurrentActivityNotFoundException
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.interfaces.services.EventEmitter

class NavigationBarModule(context: Context) : ExportedModule(context) {

  private lateinit var mActivityProvider: ActivityProvider
  private lateinit var mEventEmitter: EventEmitter

  override fun getName(): String {
    return NAME
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
      ?: throw IllegalStateException("Could not find implementation for ActivityProvider.")
    mEventEmitter = moduleRegistry.getModule(EventEmitter::class.java) ?: throw IllegalStateException("Could not find implementation for EventEmitter.")
  }

  // Ensure that rejections are passed up to JS rather than terminating the native client.
  private fun safeRunOnUiThread(promise: Promise, block: (activity: Activity) -> Unit) {
    val activity = mActivityProvider.currentActivity
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
      NavigationBar.setBackgroundColor(it, color, { promise.resolve(null) }, { m -> promise.reject(ERROR_TAG, m) })
    }
  }

  @ExpoMethod
  fun getBackgroundColorAsync(promise: Promise) {
    safeRunOnUiThread(promise) {
      val color = colorToHex(it.window.navigationBarColor)
      promise.resolve(color)
    }
  }

  @ExpoMethod
  fun setBorderColorAsync(color: Int, promise: Promise) {
    safeRunOnUiThread(promise) {
      NavigationBar.setBorderColor(it, color, { promise.resolve(null) }, { m -> promise.reject(ERROR_TAG, m) })
    }
  }

  @ExpoMethod
  fun getBorderColorAsync(promise: Promise) {
    safeRunOnUiThread(promise) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        val color = colorToHex(it.window.navigationBarDividerColor)
        promise.resolve(color)
      } else {
        promise.reject(ERROR_TAG, "'getBorderColorAsync' is only available on Android API 28 or higher")
      }
    }
  }

  @ExpoMethod
  fun setButtonStyleAsync(buttonStyle: String, promise: Promise) {
    safeRunOnUiThread(promise) {
      NavigationBar.setButtonStyle(
        it, buttonStyle,
        {
          promise.resolve(null)
        },
        { m -> promise.reject(ERROR_TAG, m) }
      )
    }
  }

  @ExpoMethod
  fun getButtonStyleAsync(promise: Promise) {
    safeRunOnUiThread(promise) {
      WindowInsetsControllerCompat(it.window, it.window.decorView).let { controller ->
        val style = if (controller.isAppearanceLightNavigationBars) "dark" else "light"
        promise.resolve(style)
      }
    }
  }

  @ExpoMethod
  fun setVisibilityAsync(visibility: String, promise: Promise) {
    safeRunOnUiThread(promise) {
      NavigationBar.setVisibility(it, visibility, { promise.resolve(null) }, { m -> promise.reject(ERROR_TAG, m) })
    }
  }

  @ExpoMethod
  fun getVisibilityAsync(promise: Promise) {
    safeRunOnUiThread(promise) {
      val isVisible = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        it.window.decorView.rootWindowInsets.isVisible(WindowInsets.Type.navigationBars())
      } else {
        @Suppress("DEPRECATION")
        (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION and it.window.decorView.systemUiVisibility) == 0
      }
      val visibility = if (isVisible) "visible" else "hidden"
      promise.resolve(visibility)
    }
  }

  @ExpoMethod
  fun setPositionAsync(position: String, promise: Promise) {
    safeRunOnUiThread(promise) {
      NavigationBar.setPosition(it, position, { promise.resolve(null) }, { m -> promise.reject(ERROR_TAG, m) })
    }
  }

  @ExpoMethod
  fun unstable_getPositionAsync(promise: Promise) {
    safeRunOnUiThread(promise) {
      val position = if (ViewCompat.getFitsSystemWindows(it.window.decorView)) "relative" else "absolute"
      promise.resolve(position)
    }
  }

  @ExpoMethod
  fun setBehaviorAsync(behavior: String, promise: Promise) {
    safeRunOnUiThread(promise) {
      NavigationBar.setBehavior(it, behavior, { promise.resolve(null) }, { m -> promise.reject(ERROR_TAG, m) })
    }
  }

  @ExpoMethod
  fun getBehaviorAsync(promise: Promise) {
    safeRunOnUiThread(promise) {
      WindowInsetsControllerCompat(it.window, it.window.decorView).let { controller ->
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

  /* Events */

  @ExpoMethod
  fun startObserving(promise: Promise) {
    safeRunOnUiThread(promise) {
      val decorView = it.window.decorView
      @Suppress("DEPRECATION")
      decorView.setOnSystemUiVisibilityChangeListener { visibility: Int ->
        var isNavigationBarVisible = (visibility and View.SYSTEM_UI_FLAG_HIDE_NAVIGATION) == 0
        var stringVisibility = if (isNavigationBarVisible) "visible" else "hidden"
        mEventEmitter.emit(
          VISIBILITY_EVENT_NAME,
          Bundle().apply {
            putString("visibility", stringVisibility)
            putInt("rawVisibility", visibility)
          }
        )
      }
      promise.resolve(null)
    }
  }

  @ExpoMethod
  fun stopObserving(promise: Promise) {
    safeRunOnUiThread(promise) {
      val decorView = it.window.decorView
      @Suppress("DEPRECATION")
      decorView.setOnSystemUiVisibilityChangeListener(null)
      promise.resolve(null)
    }
  }

  companion object {
    private const val NAME = "ExpoNavigationBar"
    private const val VISIBILITY_EVENT_NAME = "ExpoNavigationBar.didChange"
    private const val ERROR_TAG = "ERR_NAVIGATION_BAR"

    fun colorToHex(color: Int): String {
      return String.format("#%02x%02x%02x", Color.red(color), Color.green(color), Color.blue(color))
    }
  }
}
