package expo.modules.navigationbar

import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.navigationbar.singletons.NavigationBar

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

    AsyncFunction("setButtonStyleAsync") { buttonStyle: String, promise: Promise ->
      NavigationBar.setButtonStyle(
        currentActivity,
        buttonStyle,
        {
          promise.resolve(null)
        },
        { m -> promise.reject(NavigationBarException(m)) }
      )
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("setVisibilityAsync") { visibility: String, promise: Promise ->
      NavigationBar.setVisibility(currentActivity, visibility, { promise.resolve(null) }, { m -> promise.reject(NavigationBarException(m)) })
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
