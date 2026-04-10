package expo.modules.navigationbar

import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// The light scrim color used in the platform API 29+
// https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/java/com/android/internal/policy/DecorView.java;drc=6ef0f022c333385dba2c294e35b8de544455bf19;l=142
internal val LightNavigationBarColor = Color.argb(0xe6, 0xFF, 0xFF, 0xFF)

// The dark scrim color used in the platform.
// https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/res/res/color/system_bar_background_semi_transparent.xml
// https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/res/remote_color_resources_res/values/colors.xml;l=67
internal val DarkNavigationBarColor = Color.argb(0x80, 0x1b, 0x1b, 0x1b)

class NavigationBarModule : Module() {
  private val currentActivity get() = appContext.throwingActivity

  override fun definition() = ModuleDefinition {
    Name("ExpoNavigationBar")

    Events(VISIBILITY_EVENT_NAME)

    OnStartObserving {
      val decorView = currentActivity.window.decorView
      decorView.post {
        @Suppress("DEPRECATION")
        decorView.setOnSystemUiVisibilityChangeListener { visibility: Int ->
          val isNavigationBarVisible = (visibility and View.SYSTEM_UI_FLAG_HIDE_NAVIGATION) == 0
          val stringVisibility = if (isNavigationBarVisible) "visible" else "hidden"
          sendEvent(
            VISIBILITY_EVENT_NAME,
            Bundle().apply {
              putString("visibility", stringVisibility)
              putInt("rawVisibility", visibility)
            }
          )
        }
      }
    }

    OnStopObserving {
      val decorView = currentActivity.window.decorView
      decorView.post {
        @Suppress("DEPRECATION")
        decorView.setOnSystemUiVisibilityChangeListener(null)
      }
    }

    @Suppress("DEPRECATION")
    AsyncFunction("setStyle") { style: String ->
      // isAppearanceLightNavigationBars is not available below Android O.
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        return@AsyncFunction
      }

      val window = currentActivity.window
      val hasLightBackground = style == "dark" // dark content -> light background

      // android:enforceNavigationBarContrast is not available below Android Q.
      // This means the button style is not automatically adjusted for contrast,
      // so we set an explicit navigation bar color to avoid invisible buttons.
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
        window.navigationBarColor = if (hasLightBackground) LightNavigationBarColor else DarkNavigationBarColor
      }

      WindowInsetsControllerCompat(window, window.decorView).run {
        isAppearanceLightNavigationBars = hasLightBackground
      }

      return@AsyncFunction
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("setHidden") { hidden: Boolean ->
      val window = currentActivity.window

      WindowInsetsControllerCompat(window, window.decorView).run {
        systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

        when (hidden) {
          true -> hide(WindowInsetsCompat.Type.navigationBars())
          false -> show(WindowInsetsCompat.Type.navigationBars())
        }
      }

      return@AsyncFunction
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<String>("getVisibilityAsync") {
      val isVisible = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        currentActivity.window.decorView.rootWindowInsets.isVisible(WindowInsets.Type.navigationBars())
      } else {
        @Suppress("DEPRECATION")
        (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION and currentActivity.window.decorView.systemUiVisibility) == 0
      }
      return@AsyncFunction if (isVisible) "visible" else "hidden"
    }.runOnQueue(Queues.MAIN)
  }

  companion object {
    private const val VISIBILITY_EVENT_NAME = "ExpoNavigationBar.didChange"
  }
}
