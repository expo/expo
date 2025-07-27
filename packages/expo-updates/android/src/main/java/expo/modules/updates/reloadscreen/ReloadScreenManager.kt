package expo.modules.updates.reloadscreen

import android.app.Activity
import android.view.ViewGroup
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

class ReloadScreenManager {
  private var currentConfiguration: ReloadScreenConfiguration? = null
  private var currentReloadScreen: WeakReference<ReloadScreenView>? = null
  private var currentActivity: WeakReference<Activity>? = null
  private var isShowing = false
  private val scope = CoroutineScope(Dispatchers.Main)

  private val reloadListener = ReactMarker.MarkerListener { name, _, _ ->
    if (name == ReactMarkerConstants.RUN_JS_BUNDLE_END) {
      if (isShowing) {
        scope.launch {
          hide()
        }
      }
    }
  }

  fun setConfiguration(options: ReloadScreenOptions?) {
    currentConfiguration = ReloadScreenConfiguration.fromOptions(options)
  }

  fun show(activity: Activity? = null) {
    if (isShowing) {
      return
    }

    ReactMarker.addListener(reloadListener)

    val targetActivity = activity ?: currentActivity?.get()
    if (targetActivity == null) {
      return
    }

    showReloadScreen(targetActivity)
    isShowing = true
  }

  fun hide() {
    if (!isShowing) {
      return
    }

    hideReloadScreen()
    isShowing = false
  }

  private fun showReloadScreen(activity: Activity) {
    val config = currentConfiguration ?: ReloadScreenConfiguration.fromOptions(null)

    val reloadScreenView = ReloadScreenView(activity).apply {
      updateConfiguration(config)
    }

    val rootView = activity.findViewById<ViewGroup>(android.R.id.content)
    rootView?.addView(
      reloadScreenView,
      ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    )

    currentReloadScreen = WeakReference(reloadScreenView)
  }

  private fun hideReloadScreen() {
    val reloadScreen = currentReloadScreen?.get() ?: return
    val config = currentConfiguration

    if (config?.fade == true) {
      reloadScreen.animate()
        .alpha(0f)
        .setDuration(300)
        .withEndAction {
          removeView(reloadScreen)
        }
        .start()
    } else {
      removeView(reloadScreen)
    }
  }

  private fun removeView(reloadScreen: ReloadScreenView) {
    val parent = reloadScreen.parent as? ViewGroup
    parent?.removeView(reloadScreen)
    currentReloadScreen = null
    ReactMarker.removeListener(reloadListener)
  }
}
