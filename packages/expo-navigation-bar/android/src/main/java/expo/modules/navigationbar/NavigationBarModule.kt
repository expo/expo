package expo.modules.navigationbar

import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.TypedValue
import android.view.View
import android.view.Window
import android.view.WindowInsets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.interfaces.ExtraWindowEventListener
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Collections
import java.util.WeakHashMap

// The light scrim color used in the platform API 29+
// https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/java/com/android/internal/policy/DecorView.java;drc=6ef0f022c333385dba2c294e35b8de544455bf19;l=142
internal val LightNavigationBarColor = Color.argb(0xe6, 0xFF, 0xFF, 0xFF)

// The dark scrim color used in the platform.
// https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/res/res/color/system_bar_background_semi_transparent.xml
// https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/res/remote_color_resources_res/values/colors.xml;l=67
internal val DarkNavigationBarColor = Color.argb(0x80, 0x1b, 0x1b, 0x1b)

@Suppress("DEPRECATION")
internal fun Window.setNavigationBarStyle(
  hasLightBackground: Boolean,
  isContrastEnforced: Boolean,
) {
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
    return // isAppearanceLightNavigationBars is not available below Android O.
  }

  // android:enforceNavigationBarContrast is not available below Android Q.
  // This means the button style is not automatically adjusted for contrast,
  // so we set an explicit navigation bar color to avoid invisible buttons.
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
    navigationBarColor = if (hasLightBackground) LightNavigationBarColor else DarkNavigationBarColor
  } else {
    isNavigationBarContrastEnforced = isContrastEnforced
  }

  WindowInsetsControllerCompat(this, decorView).run {
    isAppearanceLightNavigationBars = hasLightBackground
  }
}

internal fun Window.setNavigationBarHidden(hidden: Boolean) {
  WindowInsetsControllerCompat(this, decorView).apply {
    systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

    when (hidden) {
      true -> hide(WindowInsetsCompat.Type.navigationBars())
      else -> show(WindowInsetsCompat.Type.navigationBars())
    }
  }
}

class NavigationBarModule : Module(), ExtraWindowEventListener {
  private val currentActivity get() = appContext.throwingActivity
  private val reactContext get() = appContext.reactContext as? ReactApplicationContext

  private val isContrastEnforced: Boolean by lazy {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      return@lazy true
    }

    val theme = currentActivity.theme
    val resId = android.R.attr.enforceNavigationBarContrast
    val value = TypedValue()

    return@lazy if (theme.resolveAttribute(resId, value, true)) {
      value.data != 0
    } else {
      true
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoNavigationBar")

    Events(VISIBILITY_EVENT_NAME)

    OnCreate {
      reactContext?.addExtraWindowEventListener(this@NavigationBarModule)
    }

    OnDestroy {
      reactContext?.removeExtraWindowEventListener(this@NavigationBarModule)
    }

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
      val hasLightBackground = style == "dark" // dark content -> light background

      currentActivity.window.setNavigationBarStyle(hasLightBackground, isContrastEnforced)
      extraWindows.forEach { it.setNavigationBarStyle(hasLightBackground, isContrastEnforced) }

      return@AsyncFunction
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("setHidden") { hidden: Boolean ->
      currentActivity.window.setNavigationBarHidden(hidden)
      extraWindows.forEach { it.setNavigationBarHidden(hidden) }

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

  override fun onExtraWindowCreate(window: Window) {
    extraWindows.add(window)

    currentActivity.window.let { activityWindow ->
      val controller = WindowCompat.getInsetsController(activityWindow, activityWindow.decorView)
      val insets = ViewCompat.getRootWindowInsets(activityWindow.decorView)
      val hasLightBackground = controller.isAppearanceLightNavigationBars
      val visible = insets?.isVisible(WindowInsetsCompat.Type.navigationBars()) ?: true

      window.setNavigationBarStyle(hasLightBackground, isContrastEnforced)
      window.setNavigationBarHidden(!visible)
    }
  }

  override fun onExtraWindowDestroy(window: Window) {
    extraWindows.remove(window)
  }

  companion object {
    private const val VISIBILITY_EVENT_NAME = "ExpoNavigationBar.didChange"
    private val extraWindows = Collections.newSetFromMap<Window>(WeakHashMap())
  }
}
