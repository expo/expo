package expo.modules.splashscreen

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.interfaces.fabric.ReactSurface
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType

/**
 * Renders the launch template (`SplashScreenPrerender.json` in the app assets) through Fabric before
 * React Native's first frame. A surface with an empty module name is started as soon as the React
 * instance exists, which registers a shadow tree without involving JS, and the template is committed
 * into it from the UI thread. The overlay is removed when the app's surface mounts its first child.
 */
object SplashScreenPrerender {
  private const val TAG = "expo-splash-screen"
  private const val TEMPLATE_ASSET = "SplashScreenPrerender.json"

  private var surface: ReactSurface? = null
  private var overlay: View? = null
  private var contentListener: ReactMarker.MarkerListener? = null

  var isActive: Boolean = false
    private set

  fun createRootViewContainer(activity: Activity): ViewGroup? {
    val template = try {
      activity.assets.open(TEMPLATE_ASSET).bufferedReader().use { it.readText() }
    } catch (e: Exception) {
      return null
    }
    val reactHost = (activity.application as? ReactApplication)?.reactHost ?: return null
    val container = FrameLayout(activity)
    isActive = true

    val surface = reactHost.createSurface(activity, "", null)
    this.surface = surface
    val view = surface.view ?: return container
    view.isClickable = false
    view.isFocusable = false
    overlay = view
    container.addView(view, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
    observeAppContent()

    val task = surface.start()
    Thread({
      try {
        task.waitForCompletion()
      } catch (e: InterruptedException) {
        return@Thread
      }
      if (task.isFaulted()) {
        Log.w(TAG, "prerender surface failed to start", task.getError())
        return@Thread
      }
      val reactContext = reactHost.currentReactContext ?: return@Thread
      val fabricUIManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC) as? FabricUIManager
        ?: return@Thread
      // Fabric executes mount items inline only when they are scheduled from the UI thread; from
      // other threads they wait for the frame callback that onHostResume enables much later.
      Handler(Looper.getMainLooper()).postAtFrontOfQueue {
        SplashScreenPrerenderNative.commit(fabricUIManager, surface.surfaceID, template)
      }
    }, "SplashScreenPrerender").start()
    return container
  }

  private fun observeAppContent() {
    val listener = ReactMarker.MarkerListener { name, tag, _ ->
      if (name != ReactMarkerConstants.CONTENT_APPEARED) return@MarkerListener
      // The prerender surface logs this marker too, with an empty module name.
      if (tag.isNullOrEmpty()) return@MarkerListener
      contentListener?.let { ReactMarker.removeListener(it) }
      contentListener = null
      if (!SplashScreenManager.preventAutoHideCalled) {
        UiThreadUtil.runOnUiThread { dismiss() }
      }
    }
    contentListener = listener
    ReactMarker.addListener(listener)
  }

  fun dismiss() {
    val view = overlay ?: return
    overlay = null
    (view.parent as? ViewGroup)?.removeView(view)
    surface?.stop()
    surface = null
  }
}
