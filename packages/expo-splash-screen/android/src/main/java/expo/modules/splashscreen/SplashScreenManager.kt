package expo.modules.splashscreen

import android.annotation.SuppressLint
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.animation.AccelerateInterpolator
import android.window.SplashScreenView
import androidx.activity.ComponentActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.splashscreen.SplashScreenViewProvider
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants

// How we keep the splash screen up until hide() is called:
// 1. The app's window draws normally underneath the splash screen view, so
//    the app is fully laid out and drawn by the time the splash screen fades.
// 2. When Android calls our setOnExitAnimationListener callback after the
//    first frame, we save its SplashScreenViewProvider in pendingSplashScreen
//    instead of fading it out. The splash screen stays on top until we remove
//    it, and it swallows touches so they don't reach the app underneath.
// 3. Once hide() is called, hideIfReady() fades it out over the
//    already-drawn app.
// 4. If the activity stops first (e.g. the user goes home during a slow
//    start), we remove the splash screen right away instead. See onStop below.
object SplashScreenManager {
  /**
   * Whether hide() has been called for the current activity's splash screen.
   * Each activity shows its own splash screen, so registerOnActivity resets
   * this. Otherwise, when Android reopens the app in a process that's still
   * running, the new splash screen would hide on its first frame.
   */
  private var isHideRequested = false
  var preventAutoHideCalled: Boolean = false
  private var exitAnimationDuration = SplashScreenOptions().duration

  /**
   * The splash screen view, once Android hands it to us after the app's first
   * frame. Null before that, after we've started hiding or removed it, and
   * after its activity is destroyed (so we don't keep a destroyed activity's
   * views in memory).
   */
  private var pendingSplashScreen: PendingSplashScreen? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  private class PendingSplashScreen(
    val provider: SplashScreenViewProvider,
    /** The lifecycle of the activity showing this splash screen */
    val lifecycle: Lifecycle
  )

  private val contentAppearedListener = ReactMarker.MarkerListener { name, _, _ ->
    if (name == ReactMarkerConstants.CONTENT_APPEARED) {
      if (!preventAutoHideCalled) {
        hide()
      }
    }
  }

  // The touch listener only swallows touches, so there's no click for
  // performClick() to handle
  @SuppressLint("ClickableViewAccessibility")
  fun registerOnActivity(mainActivity: ComponentActivity) {
    val splashScreen = mainActivity.installSplashScreen()
    ReactMarker.addListener(contentAppearedListener)
    isHideRequested = false

    val lifecycle = mainActivity.lifecycle
    splashScreen.setOnExitAnimationListener { provider ->
      // The app draws underneath the splash screen, so without this, taps
      // could hit buttons users can't see yet
      provider.view.setOnTouchListener { _, _ -> true }
      pendingSplashScreen = PendingSplashScreen(provider, lifecycle)
      hideIfReady()
    }

    lifecycle.addObserver(object : DefaultLifecycleObserver {
      /**
       * Remove the splash screen right away if the activity stops before
       * hide() is called. Animating or removing the splash screen view after
       * the activity stops can crash on API 31-33 with
       * SurfaceControl.checkNotReleased():
       * https://issuetracker.google.com/issues/242118185
       *
       * On API 29+, Android calls this before Activity.onStop(), while the
       * view is still usable. The user isn't looking at the app at this point.
       */
      override fun onStop(owner: LifecycleOwner) {
        val pending = pendingSplashScreen ?: return
        if (pending.lifecycle !== lifecycle) return
        pendingSplashScreen = null
        removeSplashScreenView(pending.provider)
      }

      override fun onDestroy(owner: LifecycleOwner) {
        if (pendingSplashScreen?.lifecycle === lifecycle) {
          pendingSplashScreen = null
        }
      }
    })
  }

  /**
   * Fades out the splash screen once hide() has been called and Android has
   * handed us its view. Must run on the main thread.
   */
  private fun hideIfReady() {
    val pending = pendingSplashScreen ?: return
    if (!isHideRequested) {
      return
    }
    pendingSplashScreen = null

    val provider = pending.provider
    val splashScreenView = provider.view
    // Let touches through as soon as the fade starts, so users can tap the
    // app while the splash screen fades
    splashScreenView.setOnTouchListener(null)
    splashScreenView
      .animate()
      .setDuration(exitAnimationDuration)
      .alpha(0.0f)
      .setInterpolator(AccelerateInterpolator())
      .withEndAction { removeSplashScreenView(provider) }
      .start()
  }

  private fun removeSplashScreenView(provider: SplashScreenViewProvider) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      provider.remove()
    } else {
      // Avoid calling applyThemesSystemBarAppearance
      (provider.view as SplashScreenView).remove()
    }
  }

  fun hide() {
    // JS calls this from its own thread, but we touch the splash screen view
    // here, so we post to the main thread
    mainHandler.post {
      isHideRequested = true
      hideIfReady()
    }
  }

  fun setSplashScreenOptions(options: SplashScreenOptions) {
    exitAnimationDuration = options.duration
  }

  fun unregisterContentAppearedListener() {
    ReactMarker.removeListener(contentAppearedListener)
  }
}
