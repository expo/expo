package expo.modules.navigationbar

import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

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

    AsyncFunction("setStyle") { style: String ->
      val window = currentActivity.window

      WindowInsetsControllerCompat(window, window.decorView).run {
        when (style) {
          "dark" -> isAppearanceLightNavigationBars = true
          "light" -> isAppearanceLightNavigationBars = false
        }
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
