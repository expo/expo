package expo.modules.navigationbar

import android.app.Activity
import android.content.res.Resources
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.Window
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import expo.modules.core.interfaces.ReactActivityLifecycleListener

internal fun Resources.Theme.getBooleanAttribute(attr: Int, defValue: Boolean): Boolean {
  val typedArray = obtainStyledAttributes(intArrayOf(attr))

  return try {
    typedArray.getBoolean(0, defValue)
  } finally {
    typedArray.recycle()
  }
}

@Suppress("DEPRECATION")
internal fun Window.disableNavigationBarContrast() {
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
    return // isAppearanceLightNavigationBars is not available below Android O.
  }

  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
    navigationBarColor = Color.TRANSPARENT
  } else {
    isNavigationBarContrastEnforced = false
  }
}

class NavigationBarReactActivityLifecycleListener : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    // Execute static tasks before the JS engine starts
    val theme = activity.theme
    val window = activity.window

    val resId = if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      R.attr.expoEnforceNavigationBarContrast
    } else {
      android.R.attr.enforceNavigationBarContrast
    }

    if (!theme.getBooleanAttribute(resId, true)) {
      window.disableNavigationBarContrast()
    }

    if (theme.getBooleanAttribute(R.attr.expoNavigationBarHidden, false)) {
      WindowInsetsControllerCompat(window, window.decorView)
        .hide(WindowInsetsCompat.Type.navigationBars())
    }
  }
}
